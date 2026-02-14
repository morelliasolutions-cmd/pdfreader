"""
Test Florence-2 pour contrôle qualité d'une installation FTTH
"""

import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForCausalLM
import time
import sys

# Configuration
MODEL_NAME = "microsoft/Florence-2-base"
device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

# Image à analyser
IMAGE_PATH = r"C:\Users\etien\OneDrive - Fibernet-S\Desktop\prise\02-04\Photo 27.03.25 14 52 34.jpg"


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
            except Exception as e:
                pass
    except Exception as e:
        pass


def analyze_ftth_installation():
    """Analyse complète d'une installation FTTH"""
    print("=" * 80)
    print("🔍 CONTRÔLE QUALITÉ - INSTALLATION PRISE OPTIQUE FTTH")
    print("=" * 80)
    print()
    
    # Vérifier disponibilité GPU
    gpu_available = torch.cuda.is_available()
    if gpu_available:
        gpu_name = torch.cuda.get_device_name(0)
        print(f"🎮 GPU détecté: {gpu_name}")
    else:
        print("⚠️  Aucun GPU détecté - Utilisation du CPU")
    print()
    
    # Avertissement sur les limitations du modèle
    print("⚠️  NOTE IMPORTANTE:")
    print("   Ce modèle généraliste n'est PAS spécifiquement entraîné pour les")
    print("   installations FTTH. Pour de meilleurs résultats, un modèle fine-tuné")
    print("   sur des images d'installations FTTH serait nécessaire.")
    print()
    
    # Appliquer le patch
    patch_florence2_model()
    
    # Démarrer le chronomètre global
    start_time_total = time.time()
    
    try:
        # Charger le modèle
        print("📥 Chargement du modèle Florence-2-base...")
        start_load = time.time()
        
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
        load_time = time.time() - start_load
        print(f"✅ Modèle chargé en {load_time:.2f}s\n")
        
        # Charger l'image
        print(f"🖼️  Chargement de l'image:")
        print(f"   {IMAGE_PATH}")
        
        try:
            image = Image.open(IMAGE_PATH)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            print(f"   Taille: {image.size}")
            print(f"   Mode: {image.mode}\n")
        except Exception as e:
            print(f"❌ Erreur chargement image: {e}")
            return
        
        # Démarrer le chronomètre de traitement
        start_processing = time.time()
        
        print("=" * 80)
        print("📋 ANALYSE EN COURS...")
        print("=" * 80)
        print()
        
        # 1. Description détaillée de l'installation
        print("1️⃣  DESCRIPTION GÉNÉRALE DE L'INSTALLATION")
        print("-" * 80)
        task = "<MORE_DETAILED_CAPTION>"
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
        parsed_answer = processor.post_process_generation(
            generated_text,
            task=task,
            image_size=(image.width, image.height)
        )
        
        description = parsed_answer.get('<MORE_DETAILED_CAPTION>', 'Non disponible')
        print(f"Description: {description}")
        print()
        
        # 2. Détection d'objets (pour identifier les composants)
        print("2️⃣  DÉTECTION DES COMPOSANTS")
        print("-" * 80)
        task = "<OD>"
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
        parsed_answer = processor.post_process_generation(
            generated_text,
            task=task,
            image_size=(image.width, image.height)
        )
        
        objects = parsed_answer.get('<OD>', {})
        if isinstance(objects, dict):
            labels = objects.get('labels', [])
            print(f"Composants détectés: {', '.join(labels) if labels else 'Aucun'}")
        print()
        
        # 3. OCR pour récupérer le numéro d'étiquette
        print("3️⃣  LECTURE DU NUMÉRO D'ÉTIQUETTE (OCR)")
        print("-" * 80)
        task = "<OCR_WITH_REGION>"
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
        parsed_answer = processor.post_process_generation(
            generated_text,
            task=task,
            image_size=(image.width, image.height)
        )
        
        ocr_result = parsed_answer.get('<OCR_WITH_REGION>', {})
        if isinstance(ocr_result, dict):
            texts = ocr_result.get('labels', [])
            print(f"Textes détectés: {texts}")
            
            # Chercher un numéro au format B.xxx.xxx.xxx.x
            import re
            etiquette_found = None
            for text in texts:
                if re.match(r'B\.\d+\.\d+\.\d+\.\d+', text):
                    etiquette_found = text
                    break
            
            if etiquette_found:
                print(f"✅ Numéro d'étiquette trouvé: {etiquette_found}")
            else:
                print(f"⚠️  Numéro d'étiquette au format B.xxx.xxx.xxx.x non détecté")
        print()
        
        # 4. Analyse de densité de régions (pour détecter l'organisation)
        print("4️⃣  ANALYSE DES RÉGIONS D'INTÉRÊT")
        print("-" * 80)
        task = "<DENSE_REGION_CAPTION>"
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
        parsed_answer = processor.post_process_generation(
            generated_text,
            task=task,
            image_size=(image.width, image.height)
        )
        
        regions = parsed_answer.get('<DENSE_REGION_CAPTION>', {})
        if isinstance(regions, dict):
            labels = regions.get('labels', [])
            print(f"Régions analysées: {len(labels)} zone(s)")
            for i, label in enumerate(labels[:5], 1):  # Afficher max 5
                print(f"   Zone {i}: {label}")
        print()
        
        # Fin du traitement
        processing_time = time.time() - start_processing
        total_time = time.time() - start_time_total
        
        # 5. Évaluation de qualité (basée sur l'analyse)
        print("=" * 80)
        print("⭐ ÉVALUATION DE QUALITÉ")
        print("=" * 80)
        print()
        
        # Critères d'évaluation basés sur la description
        score = 10.0
        criteres = []
        
        description_lower = description.lower()
        
        # Analyse des fibres
        if 'organized' in description_lower or 'neat' in description_lower or 'tidy' in description_lower:
            criteres.append("✅ Fibres bien organisées (+0 point)")
        else:
            criteres.append("⚠️  Organisation des fibres non confirmée (-1 point)")
            score -= 1
        
        # Analyse de l'alignement
        if 'straight' in description_lower or 'aligned' in description_lower:
            criteres.append("✅ Installation droite (+0 point)")
        else:
            criteres.append("⚠️  Alignement non confirmé (-0.5 point)")
            score -= 0.5
        
        # Vérification étiquette
        if etiquette_found:
            criteres.append(f"✅ Étiquette identifiée: {etiquette_found} (+0 point)")
        else:
            criteres.append("⚠️  Étiquette non détectée (-1 point)")
            score -= 1
        
        # Analyse de la propreté
        if 'clean' in description_lower or 'proper' in description_lower:
            criteres.append("✅ Installation propre (+0 point)")
        else:
            criteres.append("⚠️  Propreté non confirmée (-0.5 point)")
            score -= 0.5
        
        # Goulottes
        if 'cable' in description_lower or 'conduit' in description_lower:
            criteres.append("✅ Goulottes détectées (+0 point)")
        else:
            criteres.append("⚠️  Goulottes non mentionnées (-1 point)")
            score -= 1
        
        score = max(0, min(10, score))  # Limiter entre 0 et 10
        
        print("📊 CRITÈRES D'ÉVALUATION:")
        for critere in criteres:
            print(f"   {critere}")
        print()
        
        # Note finale
        if score >= 9:
            qualificatif = "EXCELLENT"
            emoji = "🌟"
        elif score >= 7:
            qualificatif = "TRÈS BON"
            emoji = "✅"
        elif score >= 5:
            qualificatif = "BON"
            emoji = "👍"
        elif score >= 3:
            qualificatif = "MOYEN"
            emoji = "⚠️"
        else:
            qualificatif = "INSUFFISANT"
            emoji = "❌"
        
        print("=" * 80)
        print(f"{emoji}  NOTE DE QUALITÉ GLOBALE: {score:.1f}/10 - {qualificatif}")
        print("=" * 80)
        print()
        
        # Temps de traitement
        print("⏱️  TEMPS DE TRAITEMENT:")
        print(f"   • Chargement du modèle: {load_time:.2f}s")
        print(f"   • Traitement de l'image: {processing_time:.2f}s")
        print(f"   • Temps total: {total_time:.2f}s")
        print()
        
        print("=" * 80)
        print("✅ ANALYSE TERMINÉE")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Erreur fatale: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    analyze_ftth_installation()
