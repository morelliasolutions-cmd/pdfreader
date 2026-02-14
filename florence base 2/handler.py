"""
Handler RunPod pour Microsoft Florence-2
Basé sur l'exemple officiel de Hugging Face
"""

import runpod
import torch
from PIL import Image
import io
import base64
from transformers import AutoProcessor, AutoModelForCausalLM

# Configuration du modèle (exactement comme dans l'exemple)
MODEL_NAME = "microsoft/Florence-2-base"
device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

# Variables globales
processor = None
model = None


def initialize_model():
    """Initialise le modèle Florence-2"""
    global processor, model
    
    if processor is None or model is None:
        print(f"🔄 Chargement du modèle {MODEL_NAME} sur {device}...")
        
        try:
            # Charger exactement comme dans l'exemple fourni
            # Utiliser attn_implementation="sdpa" pour éviter flash_attn si non disponible
            try:
                model = AutoModelForCausalLM.from_pretrained(
                    MODEL_NAME, 
                    torch_dtype=torch_dtype, 
                    trust_remote_code=True,
                    attn_implementation="sdpa"  # Utiliser SDPA au lieu de flash_attn
                ).to(device)
            except Exception as e:
                # Si SDPA échoue, essayer sans
                print(f"⚠️  Tentative sans attn_implementation: {str(e)}")
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
            print(f"✅ Modèle chargé avec succès sur {device}")
            
        except Exception as e:
            print(f"❌ Erreur: {str(e)}")
            raise


def decode_base64_image(image_base64):
    """Décode une image en base64"""
    try:
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return image
    except Exception as e:
        raise ValueError(f"Erreur décodage image: {str(e)}")


def handler(event):
    """
    Handler RunPod serverless
    
    Format:
    {
        "input": {
            "image": "base64_encoded_image",
            "task": "<DETAILED_CAPTION>"  # ou <OD>, <CAPTION>, etc.
        }
    }
    """
    global processor, model
    
    try:
        # Initialiser si nécessaire
        if processor is None or model is None:
            initialize_model()
        
        # Extraire les inputs
        input_data = event.get("input", {})
        image_base64 = input_data.get("image")
        task = input_data.get("task", "<DETAILED_CAPTION>")
        
        if not image_base64:
            return {"error": "Image manquante dans 'input.image'"}
        
        # Décoder l'image
        image = decode_base64_image(image_base64)
        
        # Traiter exactement comme dans l'exemple
        inputs = processor(text=task, images=image, return_tensors="pt").to(device, torch_dtype)
        
        with torch.no_grad():
            generated_ids = model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=1024,
                do_sample=False,
                num_beams=3,
            )
        
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
        
        # Parser la réponse
        try:
            parsed_answer = processor.post_process_generation(
                generated_text, 
                task=task, 
                image_size=(image.width, image.height)
            )
            return {
                "result": parsed_answer,
                "task": task,
                "model": MODEL_NAME
            }
        except Exception as e:
            # Si parsing échoue, retourner le texte brut
            return {
                "result": generated_text,
                "task": task,
                "model": MODEL_NAME,
                "warning": f"Parsing failed: {str(e)}"
            }
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Erreur: {error_msg}")
        return {"error": error_msg}


# Initialiser au démarrage
print("🚀 Initialisation Florence-2...")
try:
    initialize_model()
except Exception as e:
    print(f"⚠️  Erreur init: {str(e)}")
    print("Le modèle sera chargé à la première requête")

# Démarrer RunPod
if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
