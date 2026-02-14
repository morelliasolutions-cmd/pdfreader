"""
Script de test local pour Florence-2
"""
import torch
import requests
from PIL import Image
from transformers import AutoProcessor, AutoModelForCausalLM
import sys

# Patch pour corriger le problème _supports_sdpa avec Florence-2
def patch_florence2_model():
    """Patch la classe Florence2ForConditionalGeneration pour ajouter _supports_sdpa"""
    try:
        # Importer et patcher avant le chargement
        import transformers
        # Patcher directement dans le module modeling si possible
        if hasattr(transformers, 'models') and hasattr(transformers.models, 'florence2'):
            try:
                from transformers.models.florence2 import modeling_florence2
                if hasattr(modeling_florence2, 'Florence2ForConditionalGeneration'):
                    # Ajouter l'attribut à la classe avant l'instanciation
                    if not hasattr(modeling_florence2.Florence2ForConditionalGeneration, '_supports_sdpa'):
                        # Utiliser setattr pour forcer l'attribut
                        setattr(modeling_florence2.Florence2ForConditionalGeneration, '_supports_sdpa', False)
                        print("✅ Patch appliqué avec succès")
            except Exception as e:
                print(f"⚠️ Erreur lors du patch: {e}")
    except Exception as e:
        print(f"⚠️ Erreur lors du patch global: {e}")

def test_florence2_direct():
    print("🚀 Démarrage du test direct Florence-2...")
    
    # Appliquer le patch
    patch_florence2_model()
    
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
    print(f"Device: {device}, Dtype: {torch_dtype}")

    try:
        print("📥 Chargement du modèle...")
        model = AutoModelForCausalLM.from_pretrained("microsoft/Florence-2-base", torch_dtype=torch_dtype, trust_remote_code=True).to(device)
        processor = AutoProcessor.from_pretrained("microsoft/Florence-2-base", trust_remote_code=True)
        print("✅ Modèle chargé avec succès")

        prompt = "<OD>"
        url = "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/tasks/car.jpg?download=true"
        
        print(f"🖼️  Téléchargement de l'image de test: {url}")
        image = Image.open(requests.get(url, stream=True).raw)

        print("🔄 Traitement de l'image...")
        inputs = processor(text=prompt, images=image, return_tensors="pt").to(device, torch_dtype)

        generated_ids = model.generate(
            input_ids=inputs["input_ids"],
            pixel_values=inputs["pixel_values"],
            max_new_tokens=1024,
            do_sample=False,
            num_beams=3,
        )
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]

        parsed_answer = processor.post_process_generation(generated_text, task="<OD>", image_size=(image.width, image.height))

        print("\n🎉 Résultat:")
        print(parsed_answer)
        return True
        
    except Exception as e:
        print(f"\n❌ Erreur: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_florence2_direct()
    sys.exit(0 if success else 1)

