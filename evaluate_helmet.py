import os
import sys
import argparse
import cv2
from glob import glob

def evaluate_on_dataset(data_yaml_path: str = None, roboflow_api_key: str = None, workspace: str = "ansu", project: str = "helmet-detection-xwqa6", version: int = 3):
    """Evaluates metrics (mAP, Precision, Recall) on a dataset."""
    print("=" * 60)
    print(f"📊 Evaluating Helmet Detection Metrics on Roboflow ({workspace}/{project} v{version})")
    print("=" * 60)

    if not data_yaml_path or not os.path.exists(data_yaml_path):
        if roboflow_api_key:
            try:
                from roboflow import Roboflow
            except ImportError:
                print("[INFO] Installing roboflow python package...")
                import subprocess
                subprocess.check_call([sys.executable, "-m", "pip", "install", "roboflow"])
                from roboflow import Roboflow

            print(f"[1/3] Downloading Roboflow Dataset ({workspace}/{project} v{version})...")
            rf = Roboflow(api_key=roboflow_api_key)
            proj = rf.workspace(workspace).project(project)
            dataset = proj.version(version).download("yolov8")
            data_yaml_path = os.path.join(dataset.location, "data.yaml")
            
            # Ensure path parameter in data.yaml is set to absolute location
            if os.path.exists(data_yaml_path):
                with open(data_yaml_path, "r", encoding="utf-8") as f:
                    content = f.read()
                content = content.replace("path: ../datasets/roboflow", f"path: {dataset.location}")
                with open(data_yaml_path, "w", encoding="utf-8") as f:
                    f.write(content)
        else:
            print("[ERROR] Please provide --api-key <ROBOFLOW_KEY> or --yaml <PATH_TO_DATA_YAML>")
            return

    model_path = os.path.join(os.path.dirname(__file__), "helmet_model.pt")
    if not os.path.exists(model_path):
        model_path = os.path.join(os.path.dirname(__file__), "Backend", "helmet_model.pt")
    
    if not os.path.exists(model_path):
        print(f"[ERROR] Model file not found: {model_path}")
        return

    from ultralytics import YOLO
    model = YOLO(model_path)
    metrics = model.val(
        data=data_yaml_path,
        imgsz=640,
        batch=16,
        conf=0.45,
        iou=0.6,
        project="helmet_eval",
        name="val_results",
        exist_ok=True
    )

    print("\n" + "=" * 60)
    print("🎯 EVALUATION SUMMARY")
    print("=" * 60)
    names = model.names
    print(f"Precision (P): {metrics.box.mp*100:.2f}%")
    print(f"Recall (R):    {metrics.box.mr*100:.2f}%")
    print(f"mAP@50:        {metrics.box.map50*100:.2f}%")
    print(f"mAP@50-95:     {metrics.box.map*100:.2f}%")
    print("Saved graphs and results to: helmet_eval/val_results/")

def test_on_image(image_path: str, conf_threshold: float = 0.35):
    """Runs detection on a single image or image directory and saves annotated result."""
    model_path = os.path.join(os.path.dirname(__file__), "helmet_model.pt")
    if not os.path.exists(model_path):
        model_path = os.path.join(os.path.dirname(__file__), "Backend", "helmet_model.pt")
    
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
    print(f"🔍 Testing Helmet Model on {len(image_files)} image(s)...")
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

    with_helmet_cnt = class_counts.get("with_helmet", 0)
    no_helmet_cnt = class_counts.get("no_helmet", 0)
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
    parser.add_argument("--image", type=str, help="Path to single image or folder of images to test")
    parser.add_argument("--api-key", type=str, help="Roboflow API key to download validation dataset")
    parser.add_argument("--yaml", type=str, help="Path to data.yaml for mAP evaluation")
    parser.add_argument("--workspace", type=str, default="ansu", help="Roboflow workspace name (default: ansu)")
    parser.add_argument("--project", type=str, default="helmet-detection-xwqa6", help="Roboflow project name (default: helmet-detection-xwqa6)")
    parser.add_argument("--version", type=int, default=3, help="Roboflow dataset version (default: 3)")
    parser.add_argument("--conf", type=float, default=0.35, help="Confidence threshold (default 0.35)")

    args = parser.parse_args()

    if args.image:
        test_on_image(args.image, conf_threshold=args.conf)
    elif args.yaml or args.api_key:
        evaluate_on_dataset(
            data_yaml_path=args.yaml,
            roboflow_api_key=args.api_key,
            workspace=args.workspace,
            project=args.project,
            version=args.version
        )
    elif len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        # Direct positional argument compatibility
        if os.path.exists(sys.argv[1]):
            test_on_image(sys.argv[1])
        else:
            evaluate_on_dataset(roboflow_api_key=sys.argv[1])
    else:
        print("Usage examples:")
        print(" 1. Test image/folder:")
        print("    python evaluate_helmet.py --image path/to/image.jpg")
        print("    python evaluate_helmet.py --image path/to/folder")
        print(" 2. Evaluate accuracy metrics (mAP, Precision, Recall) using Roboflow API key:")
        print("    python evaluate_helmet.py --api-key <ROBOFLOW_API_KEY>")
        print(" 3. Evaluate using local dataset data.yaml:")
        print("    python evaluate_helmet.py --yaml path/to/data.yaml")

