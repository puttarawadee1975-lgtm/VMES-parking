import os
import sys
import argparse
import cv2
from glob import glob

def test_on_image(image_path: str = "test helmet", conf_threshold: float = 0.35):
    """Runs detection on a single image or image directory and saves annotated result."""
    model_path = os.path.join(os.path.dirname(__file__), "helmet_model.pt")
    if not os.path.exists(model_path):
        model_path = os.path.join(os.path.dirname(__file__), "Backend", "helmet_model.pt")
    
    if not os.path.exists(model_path):
        print(f"[ERROR] Model file not found: {model_path}")
        return

    from ultralytics import YOLO
    model = YOLO(model_path)

    if not os.path.exists(image_path):
        parent_candidate = os.path.join("..", image_path)
        if os.path.exists(parent_candidate):
            image_path = parent_candidate

    image_files = []
    if os.path.isdir(image_path):
        for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.avif', '*.JPG', '*.JPEG', '*.PNG', '*.WEBP', '*.AVIF']:
            image_files.extend(glob(os.path.join(image_path, ext)))
    elif os.path.isfile(image_path):
        image_files = [image_path]
    else:
        print(f"[ERROR] Path not found: {image_path}")
        return

    output_dir = os.path.join(os.path.dirname(__file__), "helmet_eval_outputs")
    os.makedirs(output_dir, exist_ok=True)

    print("=" * 60)
    print(f"🔍 Testing Helmet Model on {len(image_files)} image(s) from '{image_path}'...")
    print("=" * 60)

    from collections import Counter
    class_counts = Counter()
    class_confs = {}
    detected_images_count = 0
    ground_truth_evaluated = 0
    ground_truth_matches = 0

    for img_fp in image_files:
        filename = os.path.basename(img_fp)
        results = model(img_fp, conf=conf_threshold, verbose=False)
        img = cv2.imread(img_fp)

        if img is None:
            try:
                from PIL import Image
                import pillow_avif
                import numpy as np
                pil_img = Image.open(img_fp).convert('RGB')
                img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            except Exception:
                print(f"[SKIP] Cannot open image: {filename}")
                continue

        detections = []
        has_detection = False
        frame_labels = []
        norm_labels = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls_id]
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                has_detection = True
                frame_labels.append(label)
                
                clean_lbl = label.lower().replace(" ", "_")
                if "without" in clean_lbl or "no" in clean_lbl:
                    norm_labels.append("no_helmet")
                elif "with" in clean_lbl or "helmet" in clean_lbl:
                    norm_labels.append("with_helmet")
                else:
                    norm_labels.append(clean_lbl)

                class_counts[label] += 1
                class_confs.setdefault(label, []).append(conf)

                # Color: Green for with_helmet, Red for no_helmet, Yellow for others
                if "with" in label.lower() and "without" not in label.lower():
                    color = (0, 255, 0)
                elif "without" in label.lower() or "no" in label.lower():
                    color = (0, 0, 255)
                else:
                    color = (0, 255, 255)

                cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
                cv2.putText(img, f"{label} {conf:.2f}", (x1, max(20, y1 - 10)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                detections.append(f"{label} ({conf*100:.1f}%)")

        # Save annotated image output safely
        save_filename = filename if filename.lower().endswith(('.jpg', '.jpeg', '.png')) else f"{os.path.splitext(filename)[0]}.jpg"
        out_path = os.path.join(output_dir, f"result_{save_filename}")
        cv2.imwrite(out_path, img)

        # Ground Truth check based on Thai & English filename keywords
        gt_expected = []
        fn_lower = filename.lower()
        if "ไม่ใส่" in filename or "without" in fn_lower or "no_helmet" in fn_lower:
            gt_expected = ["no_helmet"]
        elif "ใส่" in filename or "with" in fn_lower or "helmet" in fn_lower:
            gt_expected = ["with_helmet"]

        match_badge = ""
        if gt_expected:
            ground_truth_evaluated += 1
            if all(item in norm_labels for item in gt_expected):
                ground_truth_matches += 1.0
                match_badge = " [🎯 Ground Truth: EXACT MATCH]"
            elif any(item in norm_labels for item in gt_expected):
                ground_truth_matches += 0.5
                match_badge = " [🟡 Ground Truth: PARTIAL MATCH]"
            else:
                match_badge = " [❌ Ground Truth: MISSED]"

        if has_detection:
            detected_images_count += 1
            print(f"✅ {filename}{match_badge}: Found {', '.join(detections)}")
        else:
            print(f"⚠️ {filename}{match_badge}: No helmet/person detected")

    total_images = len(image_files)
    # Line calculating Accuracy Rate
    overall_accuracy = (ground_truth_matches / ground_truth_evaluated * 100) if ground_truth_evaluated > 0 else ((detected_images_count / total_images * 100) if total_images > 0 else 0)

    print("\n" + "=" * 60)
    print(f"🎯 OVERALL SYSTEM ACCURACY RATE: {overall_accuracy:.1f}%")
    print("=" * 60)
    print(f"Total Test Images:       {total_images}")
    print(f"Correctly Analyzed:     {int(ground_truth_matches if ground_truth_evaluated > 0 else detected_images_count)} / {total_images} images")
    print(f"System Accuracy Score:  {overall_accuracy:.1f}%\n")

    print("Detected Objects Breakdown:")
    print(f"{'Class Label':<18} | {'Total Count':<12} | {'Avg Confidence':<15}")
    print("-" * 52)
    for label, count in class_counts.items():
        confs = class_confs.get(label, [])
        avg_conf = (sum(confs) / len(confs) * 100) if confs else 0
        print(f"{label:<18} | {count:<12} | {avg_conf:.1f}%")

    with_helmet_cnt = class_counts.get("With Helmet", class_counts.get("with_helmet", 0))
    no_helmet_cnt = class_counts.get("Without Helmet", class_counts.get("no_helmet", 0))
    total_helmets = with_helmet_cnt + no_helmet_cnt

    if total_helmets > 0:
        compliance_rate = (with_helmet_cnt / total_helmets) * 100
        print("\nHelmet Compliance Summary:")
        print(f"  • With Helmet: {with_helmet_cnt} ({compliance_rate:.1f}%)")
        print(f"  • No Helmet:   {no_helmet_cnt} ({100 - compliance_rate:.1f}%)")

    print("=" * 60)
    print(f"📁 All annotated images saved to: {output_dir}")
    print("=" * 60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Helmet Detection Accuracy & Testing Tool")
    parser.add_argument("--image", type=str, default="test helmet", help="Path to single image or folder of images to test (default: 'test helmet')")
    parser.add_argument("--conf", type=float, default=0.35, help="Confidence threshold (default 0.35)")

    args = parser.parse_args()

    target_path = args.image
    if len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        target_path = sys.argv[1]

    test_on_image(target_path, conf_threshold=args.conf)
