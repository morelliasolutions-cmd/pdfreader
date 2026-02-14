// Implementation: Simple Compression + Upload + DB Record (No AI/n8n)

// Increase compression: Max 1280px, 0.7 quality
const COMPRESSION_MAX_SIZE = 1920;
const COMPRESSION_QUALITY = 0.8;

async function handlePhotoUpload(input, photoId) {
    if (!input.files || !input.files[0]) return;
    const originalFile = input.files[0];
    
    // Preview Logic (Immediate)
    if(typeof photos !== 'undefined') {
        photos[photoId] = { dataUrl: URL.createObjectURL(originalFile), file: originalFile, timestamp: new Date().toISOString() };
    }
    const reader = new FileReader();
    reader.onload = function(e){
        const preview = document.getElementById(`preview-${photoId}`);
        const placeholder = document.getElementById(`placeholder-${photoId}`);
        const removeBtn = document.getElementById(`remove-${photoId}`);
        if(preview) { preview.src = e.target.result; preview.classList.remove('hidden'); }
        if(placeholder) placeholder.classList.add('hidden');
        if(removeBtn) removeBtn.classList.remove('hidden');
        if(typeof updatePhotosCount === 'function') updatePhotosCount();
    };
    reader.readAsDataURL(originalFile);

    // Initial Status
    updatePhotoStatusUI(photoId, 'loading');

    // Process
    processPhotoUpload(photoId, originalFile);
}

async function processPhotoUpload(photoId, originalFile) {
    try {
        console.log(`Processing upload for ${photoId}...`);

        // 1. Compress Image
        console.log(`Original size: ${(originalFile.size / 1024).toFixed(2)} KB`);
        const compressedFile = await compressImage(originalFile);
        console.log(`Compressed size: ${(compressedFile.size / 1024).toFixed(2)} KB`);

        // 2. Upload to Storage
        const storagePath = await uploadToSupabaseStorage(photoId, compressedFile);
        
        // 3. Create DB Record
        const dbRecord = await savePhotoRecord(photoId, compressedFile, storagePath);

        // 4. Update UI (Analyzing - keep loader active)
        updatePhotoStatusUI(photoId, 'analyzing');
        
        // 5. Subscribe to real-time AI validation results via WebSocket
        if (dbRecord && dbRecord.id && typeof subscribeToAIValidation === 'function') {
            subscribeToAIValidation(photoId, dbRecord.id);
        } else {
            console.warn('⚠️ subscribeToAIValidation not available, falling back to no real-time updates');
            // Fallback: stop loader after 5 seconds
            setTimeout(() => updatePhotoStatusUI(photoId, 'complete'), 5000);
        }

    } catch (error) {
        console.error('Error in processPhotoUpload:', error);
        updatePhotoStatusUI(photoId, 'error');
    }
}

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const maxWidth = COMPRESSION_MAX_SIZE;
        const maxHeight = COMPRESSION_MAX_SIZE;
        const quality = COMPRESSION_QUALITY;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Simple aspect ratio resize
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height *= maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width *= maxHeight / height));
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(blob => {
                    if (!blob) {
                         // Fallback to original if compression fails
                        console.warn("Canvas blob failed, using original");
                        resolve(file);
                        return;
                    }
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(newFile);
                }, 'image/jpeg', quality);
            };
            img.onerror = error => {
                console.warn("Image compression failed (likely HEIC/unsupported format). Uploading original file instead.", error);
                // Fallback: Resolve with original file instead of failing
                resolve(file);
            };
        };
        reader.onerror = error => {
            console.error("FileReader error:", error);
            // If we can't read the file at all, we can't upload it.
            reject(new Error("Failed to read file"));
        };
    });
}

async function uploadToSupabaseStorage(photoId, file) {
    if (!window.supabase || !currentInterventionId) throw new Error("Supabase/Intervention not ready");
    
    // Retrieve PTO Reference for filename
    const ptoReference = document.getElementById('pto-reference')?.textContent?.trim() || 'unknown-b';
    const safePto = ptoReference.replace(/[^a-zA-Z0-9.\-_]/g, '_'); // Sanitize for filename

    // Determine extension from file name or default to jpg
    let finalExt = 'jpg';
    if (file.name && file.name.includes('.')) {
        finalExt = file.name.split('.').pop().toLowerCase();
    }
    // Determine mime type if possible for upload options (optional but good)
    const options = { upsert: true };
    if (file.type) options.contentType = file.type;
    
    // Construct simplified filename: interventionId / photoRef - timestamp . ext
    const timestamp = Date.now();
    const fileName = `${currentInterventionId}/${photoId}-${timestamp}.${finalExt}`;
    
    // Use 'intervention-photos-private' bucket (nouveau système)
    const { data, error } = await window.supabase.storage
        .from('intervention-photos-private')
        .upload(fileName, file, options);
    
    if (error) {
        console.error("Private upload failed", error);
        throw error; 
    }
    return fileName; // Chemin relatif dans le bucket
}

async function savePhotoRecord(photoId, file, storagePath) {
    if (!window.supabase) return null;

    // Récupérer les informations du technicien
    const technicianEmail = (await window.supabase.auth.getUser()).data?.user?.email;
    let technicianName = null;
    let technicianId = null;
    
    if (technicianEmail) {
        const { data: empData } = await window.supabase
            .from('employees')
            .select('id, first_name, last_name')
            .eq('email', technicianEmail)
            .maybeSingle();
        
        if (empData) {
            technicianName = `${empData.first_name} ${empData.last_name}`;
            technicianId = empData.id;
        }
    }
    
    // Récupérer les métadonnées de l'intervention depuis le DOM
    const ptoReference = document.getElementById('pto-reference')?.textContent?.trim() || null;
    const mandateNumber = document.getElementById('mandate-number')?.textContent?.trim() || null;
    const activityLabel = document.getElementById('activity-label')?.textContent?.trim() || null;
    
    // Récupérer les couleurs des fibres (pas les numéros)
    const fibreColors = {
        fibre1: document.getElementById('fibre-1')?.textContent?.trim() || null,
        fibre2: document.getElementById('fibre-2')?.textContent?.trim() || null,
        fibre3: document.getElementById('fibre-3')?.textContent?.trim() || null,
        fibre4: document.getElementById('fibre-4')?.textContent?.trim() || null
    };
    
    // Générer une URL signée temporaire (1 heure)
    const { data: signedUrlData } = await window.supabase
        .storage
        .from('intervention-photos-private')
        .createSignedUrl(storagePath, 3600);
    
    const storageUrl = signedUrlData?.signedUrl || null;

    // 1. Update/Delete Legacy 'intervention_photos' for APP UI stability
    await window.supabase
        .from('intervention_photos')
        .delete()
        .eq('intervention_detail_id', currentInterventionId)
        .eq('photo_type', photoId);

    const record = {
        intervention_detail_id: currentInterventionId,
        photo_type: photoId,
        photo_label: getPhotoLabel(photoId),
        storage_path: storagePath,
        storage_url: storageUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        
        // Métadonnées technicien
        technician_name: technicianName,
        technician_id: technicianId,
        capture_timestamp: new Date().toISOString(),
        
        // Métadonnées intervention
        pto_reference: ptoReference,
        mandate_number: mandateNumber,
        fibre_colors: fibreColors,
        
        // Métadonnées supplémentaires
        metadata: {
            activity_type: activityLabel
        },
        
        uploaded_at: new Date().toISOString(),
        validation_status: 'pending'
    };
    
    // Insert for App Logic
    const { data: legacyData, error } = await window.supabase
        .from('intervention_photos')
        .insert(record)
        .select()
        .single();

    if (error) console.error('Legacy DB Insert Error:', error);

    // 2. Insert into 'upload_events' for N8N TRIGGER
    const { error: triggerError } = await window.supabase
        .from('upload_events')
        .insert({
            type: 'intervention_photo',
            related_id: currentInterventionId,
            storage_path: storagePath,
            bucket_id: 'intervention-photos-private',
            metadata: {
                photo_type: photoId, 
                label: getPhotoLabel(photoId),
                file_name: file.name,
                technician_name: technicianName,
                pto_reference: ptoReference,
                mandate_number: mandateNumber,
                activity_type: activityLabel,
                fibre_colors: fibreColors
            }
        });

    if (triggerError) console.error('Upload Event Trigger Error:', triggerError);

    console.log(`✅ Photo ${photoId} enregistrée avec métadonnées complètes`);
    console.log(`📊 Technicien: ${technicianName}, OTO: ${ptoReference}, Mandat: ${mandateNumber}, Type: ${activityLabel}`);

    return legacyData;
}

function updatePhotoStatusUI(photoId, state) {
    console.log(`🔄 updatePhotoStatusUI called: photoId=${photoId}, state=${state}`);
    
    const infoBtn = document.getElementById(`ai-info-btn-${photoId}`);
    const card = document.querySelector(`#preview-${photoId}`)?.closest('.relative.aspect-square');
    
    if (!infoBtn) {
        console.warn(`⚠️ Info button not found for ${photoId}`);
        return;
    }

    if (state === 'loading' || state === 'analyzing') {
        infoBtn.classList.remove('hidden');
        infoBtn.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">sync</span>';
        infoBtn.classList.add('bg-gray-500/80');
        infoBtn.classList.remove('bg-green-500/80', 'bg-red-500/80');
        if (card) {
            card.classList.remove('border-green-400', 'border-red-400', 'shadow-green-400/50', 'shadow-red-400/50');
            card.classList.add('border-gray-400');
        }
    } else if (state === 'error') {
        infoBtn.classList.remove('hidden');
        infoBtn.innerHTML = '<span class="material-symbols-outlined text-[14px]">error</span>';
        infoBtn.classList.add('bg-red-500/80');
        infoBtn.classList.remove('bg-gray-500/80', 'bg-green-500/80');
    } else if (state === 'success' || state === 'complete') {
        // L'état sera mis à jour quand on recevra les données de validation
        // Mais on arrête le loader
        console.log(`✅ Stopping loader for ${photoId}`);
        infoBtn.classList.remove('hidden');
        infoBtn.innerHTML = '<span class="material-symbols-outlined text-[14px]">info</span>';
        infoBtn.classList.remove('bg-gray-500/80');
    }
}

async function handleOTDRUpload(input, otdrNumber) {
    const file = input.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Veuillez sélectionner un fichier PDF');
        input.value = '';
        return;
    }

    const placeholder = document.getElementById(`otdr-placeholder-${otdrNumber}`);
    const preview = document.getElementById(`otdr-preview-${otdrNumber}`);
    const nameEl = document.getElementById(`otdr-name-${otdrNumber}`);
    if (placeholder) placeholder.classList.add('hidden');
    if (preview) preview.classList.remove('hidden');
    if (nameEl) nameEl.textContent = file.name;
    if (typeof otdrFiles !== 'undefined') otdrFiles[otdrNumber] = file;
    if (typeof updateOTDRCount === 'function') updateOTDRCount();

    // PDF Upload - No compression
    try {
        const photoId = `otdr-${otdrNumber}`;
        const storagePath = await uploadToSupabaseStorage_PDF(photoId, file);
        await savePhotoRecord(photoId, file, storagePath);
        console.log(`OTDR ${otdrNumber} uploaded.`);
    } catch(e) {
        console.error("OTDR Upload Error:", e);
    }
}

// Special upload for PDF keeping original extension
async function uploadToSupabaseStorage_PDF(photoId, file) {
    if (!window.supabase || !currentInterventionId) throw new Error("Supabase/Intervention not ready");
    
    const ptoReference = document.getElementById('pto-reference')?.textContent?.trim() || 'unknown-b';
    const safePto = ptoReference.replace(/[^a-zA-Z0-9.\-_]/g, '_'); 

    const fileExt = file.name.split('.').pop();
    const fileName = `${currentInterventionId}/${photoId}-${safePto}.${fileExt}`;
    // Use private bucket
    const filePath = `interventions/${fileName}`;
    const { data, error } = await window.supabase.storage
        .from('private-uploads')
        .upload(filePath, file, { upsert: true });
        
    if (error) throw error;
    return filePath;
}
