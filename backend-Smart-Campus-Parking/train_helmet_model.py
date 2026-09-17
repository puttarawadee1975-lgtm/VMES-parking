import os
import sys
import yaml
from pathlib import Path
from collections import Counter

def train_custom_helmet_model(roboflow_api_key: str):
    print("=" * 60)
    print("Smart Campus Parking - Helmet Detection Trainer")
    print("Roboflow Project: phattarawadee-aodluk/helmet-detection-ar0n2-3olon")
    print("=" * 60)

    try:
        from roboflow import Roboflow
    except ImportError:
        print("[INFO] Installing roboflow python package...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "roboflow"])
        from roboflow import Roboflow

    rf = Roboflow(api_key=roboflow_api_key)
    project = rf.workspace("phattarawadee-aodluk").project("helmet-detection-ar0n2-3olon")
    
    print("[1/4] Downloading dataset from Roboflow...")
    dataset = project.version(1).download("yolov8")
    dataset_location = dataset.location

    data_yaml_path = os.path.join(dataset_location, "data.yaml")
    print(f"[2/4] Analyzing dataset class count at: {data_yaml_path}")

    # Count images per class
    if os.path.exists(data_yaml_path):
        with open(data_yaml_path, "r", encoding="utf-8") as f:
            data_cfg = yaml.safe_load(f)
        names = data_cfg.get("names", [])
        print(f"[DATASET CLASSES] {names}")

        # Scan label files for class counts
        labels_dir = os.path.join(dataset_location, "train", "labels")
        class_counts = Counter()
        if os.path.exists(labels_dir):
            for label_file in Path(labels_dir).glob("*.txt"):
                with open(label_file, "r") as lf:
                    for line in lf:
                        parts = line.strip().split()
                        if parts:
                            cls_id = int(parts[0])
                            cls_name = names[cls_id] if cls_id < len(names) else f"class_{cls_id}"
                            class_counts[cls_name] += 1
            
            print("\n" + "="*40)
            print("📊 EXACT CLASS ANNOTATION COUNTS:")
            for cls_name, cnt in class_counts.items():
                print(f"   • {cls_name}: {cnt} annotations")
            print("="*40 + "\n")

    print("[3/4] Fine-tuning YOLO model...")
    from ultralytics import YOLO
    model = YOLO("yolo11n.pt")
    
    results = model.train(
        data=data_yaml_path,
        epochs=30,
        imgsz=640,
        batch=16,
        project="helmet_training",
        name="run_helmet",
        exist_ok=True
    )

    best_model_path = os.path.join("helmet_training", "run_helmet", "weights", "best.pt")
    target_path = os.path.join(os.path.dirname(__file__), "helmet_model.pt")

    if os.path.exists(best_model_path):
        import shutil
        shutil.copy(best_model_path, target_path)
        print(f"\n[SUCCESS] New Helmet Model saved to: {target_path}")
        print("Previous model replaced cleanly.")
    else:
        print("[WARNING] Could not find trained best.pt weights.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        api_key = sys.argv[1]
        train_custom_helmet_model(api_key)
    else:
        print("Usage: python train_helmet_model.py <ROBOFLOW_API_KEY>")
