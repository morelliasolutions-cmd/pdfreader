"""
Script de test simple pour Microsoft Florence-2-base
Charge le modèle, traite une image de test et affiche le résultat
"""

import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForCausalLM
import requests
import io
import os
import sys

# Configuration
MODEL_NAME = "microsoft/Florence-2-base"
device = "cpu"  # CPU par défaut (peut être changé en "cuda:0" si GPU disponible)
torch_dtype = torch.float32  # float32 pour CPU


def patch_florence2_model():
    """Patch pour corriger le problème _supports_sdpa avec Florence-2"""
    try:
        import transformers
        if hasattr(transformers, 'models') and hasattr(transformers.models, 'florence2'):
            try:
                from transformers.models.florence2 import modeling_florence2
                if hasattr(modeling_florence2, 'Florence2ForConditionalGeneration'):
                    if not hasattr(modeling_florence2.Florence2ForConditionalGeneration, '_supports_sdpa'):
                        setattr(modeling_florence2.Florence2ForConditionalGeneration, '_supports_sdpa', False)
                        print("✅ Patch SDPA appliqué avec succès")
            except Exception as e:
                print(f"⚠️  Avertissement patch: {e}")
    except Exception as e:
        print(f"⚠️  Avertissement patch global: {e}")


def download_test_image(url, output_path="test.jpg"):
    """Télécharge une image de test depuis une URL"""
    try:
        print(f"📥 Téléchargement de l'image de test...")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        image = Image.open(io.BytesIO(response.content))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        image.save(output_path)
        print(f"✅ Image sauvegardée: {output_path}")
        return output_path
    except Exception as e:
        print(f"❌ Erreur téléchargement: {e}")
        return None


def test_florence2():
    """Fonction principale de test"""
    print("=" * 60)
    print("🚀 Test de Microsoft Florence-2-base")
    print("=" * 60)
    
    # Appliquer le patch
    patch_florence2_model()
    
    print(f"\n📊 Configuration:")
    print(f"   Device: {device}")
    print(f"   Dtype: {torch_dtype}")
    print(f"   Model: {MODEL_NAME}\n")
    
    try:
        # Charger le modèle
        print("📥 Chargement du modèle et du processeur...")
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch_dtype,
            trust_remote_code=True
        ).to(device)
        
        processor = AutoProcessor.from_pretrained(
            MODEL_NAME,
            trust_remote_code=True
        )
        
        model.eval()
        print("✅ Modèle chargé avec succès\n")
        
        # Préparer l'image de test
        test_image_path = "test.jpg"
        
        if not os.path.exists(test_image_path):
            # Télécharger une image de test
            test_url = "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/tasks/car.jpg"
            test_image_path = download_test_image(test_url, test_image_path)
            
            if not test_image_path:
                print("❌ Impossible de charger l'image de test")
                return
        
        print(f"🖼️  Chargement de l'image: {test_image_path}")
        image = Image.open(test_image_path)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        print(f"   Taille: {image.size}\n")
        
        # Tester différentes tâches
        tasks = [
            ("<CAPTION>", "Description courte"),
            ("<DETAILED_CAPTION>", "Description détaillée"),
            ("<MORE_DETAILED_CAPTION>", "Description très détaillée"),
        ]
        
        for task_prompt, task_name in tasks:
            print(f"📋 {task_name} ({task_prompt})")
            print("-" * 60)
            
            try:
                # Préparer les inputs
                inputs = processor(
                    text=task_prompt,
                    images=image,
                    return_tensors="pt"
                ).to(device, torch_dtype)
                
                # Générer
                with torch.no_grad():
                    generated_ids = model.generate(
                        input_ids=inputs["input_ids"],
                        pixel_values=inputs["pixel_values"],
                        max_new_tokens=1024,
                        do_sample=False,
                        num_beams=3,
                    )
                
                # Décoder
                generated_text = processor.batch_decode(
                    generated_ids,
                    skip_special_tokens=False
                )[0]
                
                # Parser
                parsed_answer = processor.post_process_generation(
                    generated_text,
                    task=task_prompt,
                    image_size=(image.width, image.height)
                )
                
                print(f"✅ Résultat: {parsed_answer}")
                print()
                
            except Exception as e:
                print(f"❌ Erreur: {e}\n")
        
        print("=" * 60)
        print("✅ Test terminé avec succès!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Erreur fatale: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    test_florence2()
