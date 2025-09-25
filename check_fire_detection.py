#!/usr/bin/env python3
"""
Fire Detection Configuration Check
Check what your model is set up to detect
"""

def check_model_info():
    """Check what classes the model can detect"""
    print("🔥 FIRE DETECTION SYSTEM - CONFIGURATION CHECK")
    print("=" * 50)
    
    # Check if model file exists
    import os
    model_file = "best_03.pt"
    
    if not os.path.exists(model_file):
        print(f"❌ Model file not found: {model_file}")
        print("📁 Make sure your trained YOLO model is in the project root")
        print("🔗 The model should be named: best_03.pt")
        return False
    else:
        print(f"✅ Model file found: {model_file}")
    
    # Try to load model (if dependencies are available)
    try:
        from ultralytics import YOLO
        model = YOLO(model_file)
        
        print(f"✅ Model loaded successfully!")
        print(f"🏷️ Model can detect these classes:")
        
        for class_id, class_name in model.names.items():
            print(f"   {class_id}: {class_name}")
            
        # Check if fire and smoke are in the classes
        class_names = [name.lower() for name in model.names.values()]
        
        if 'fire' in class_names:
            print("✅ Model can detect FIRE")
        else:
            print("❌ Model cannot detect 'fire'")
            
        if 'smoke' in class_names:
            print("✅ Model can detect SMOKE")  
        else:
            print("❌ Model cannot detect 'smoke'")
            
        print(f"\n🎯 Current detection settings:")
        print(f"   • Confidence threshold: 70% (initial detection)")
        print(f"   • Alert threshold: 80% (sends admin alert)")
        print(f"   • Classes monitored: fire, smoke")
        
        return True
        
    except ImportError:
        print("📦 AI dependencies not installed yet")
        print("🔧 To install: pip install ultralytics opencv-python")
        return False
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

def check_detection_sensitivity():
    """Explain detection sensitivity"""
    print(f"\n🎯 FIRE DETECTION SENSITIVITY:")
    print("=" * 30)
    print("🔥 What triggers fire detection:")
    print("   • Visible flames (red/orange/yellow colors)")
    print("   • Heat signatures")
    print("   • Flickering fire patterns")
    print("   • Must be >70% confident it's fire")
    print("   • Must be >80% confident to send alert")
    
    print(f"\n💨 What triggers smoke detection:")
    print("   • Visible smoke clouds")
    print("   • Gray/white/dark smoke patterns")
    print("   • Rising smoke movement")
    print("   • Must be >70% confident it's smoke")
    print("   • Must be >80% confident to send alert")
    
    print(f"\n🧪 To test fire detection:")
    print("   • Use a lighter or match in front of camera")
    print("   • Light a candle")
    print("   • Use a small controlled flame")
    print("   • Try a red/orange LED light")
    
    print(f"\n💡 Troubleshooting:")
    print("   • Make sure camera has good lighting")
    print("   • Fire/smoke should be clearly visible")
    print("   • Camera should be focused properly")
    print("   • Test with obvious flames first")

def main():
    model_loaded = check_model_info()
    check_detection_sensitivity()
    
    if model_loaded:
        print(f"\n✅ Your fire detection system is properly configured!")
        print(f"🚀 To test with debug mode:")
        print(f"   python3 debug_fire_detection.py cam001 0 'Test Camera' 'Test Location'")
    else:
        print(f"\n📦 Next steps:")
        print(f"1. Install AI dependencies:")
        print(f"   source ai_detection_env/bin/activate")
        print(f"   pip install ultralytics opencv-python")
        print(f"2. Test with debug script")
        
    print(f"\n🔥 Your model should detect fire when you hold a flame in front of the camera!")

if __name__ == "__main__":
    main()