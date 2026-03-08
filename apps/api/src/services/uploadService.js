export async function parsePdfUpload(request) {
    // 1. Initial Guard: Content-Length limits BEFORE parsing 
    // Reject > 6MB immediately to prevent multipart boundary attacks overwhelming memory
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 6 * 1024 * 1024) {
        throw new Error('Payload muito largo. Limite global é de 6MB.');
    }

    // Parse FormData into memory
    let formData;
    try {
        formData = await request.formData();
    } catch (e) {
        throw new Error('Falha ao processar formulário (multipart/form-data malformado).');
    }

    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
        throw new Error('Nenhum arquivo encontrado no campo "file".');
    }

    // 2. Strict size check after parsing
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('O arquivo excede o limite máximo de 5MB.');
    }

    // 3. MIME type text-based defense
    if (file.type !== 'application/pdf') {
        throw new Error('Apenas arquivos PDF são permitidos.');
    }

    // Load file bytes into memory
    const arrayBuffer = await file.arrayBuffer();

    // 4. Magic Bytes Defense (MIME Spoofing prevention)
    // PDF Magic Bytes: %PDF- (hex: 25 50 44 46 2D)
    const uint8Array = new Uint8Array(arrayBuffer);
    if (uint8Array.length < 5) {
        throw new Error('Arquivo inválido ou vazio.');
    }

    const isPdf = uint8Array[0] === 0x25 && // %
        uint8Array[1] === 0x50 && // P
        uint8Array[2] === 0x44 && // D
        uint8Array[3] === 0x46 && // F
        uint8Array[4] === 0x2D;   // -

    if (!isPdf) {
        throw new Error('O arquivo não é um PDF válido (Magic Bytes mismatch).');
    }

    // 5. Generate UUID
    const id = crypto.randomUUID();

    return {
        id,
        originalName: file.name,
        buffer: arrayBuffer,
        size: file.size,
        type: file.type
    };
}

export async function parseImageUpload(request) {
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 6 * 1024 * 1024) {
        throw new Error('Payload muito largo. Limite global é de 6MB.');
    }

    let formData;
    try {
        formData = await request.formData();
    } catch (e) {
        throw new Error('Falha ao processar formulário (multipart/form-data malformado).');
    }

    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
        throw new Error('Nenhuma imagem encontrada no campo "file".');
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem excede o limite máximo de 5MB.');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Apenas imagens JPEG, PNG e WEBP são permitidas.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (uint8Array.length < 4) {
        throw new Error('Arquivo inválido ou vazio.');
    }

    // Magic Bytes Verification
    let isImage = false;

    // JPEG: FF D8 FF
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
        isImage = true;
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    else if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
        isImage = true;
    }
    // WEBP: RIFF + 4 bytes + WEBP
    else if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46 &&
        uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50) {
        isImage = true;
    }

    if (!isImage) {
        throw new Error('A imagem não é um formato válido (Magic Bytes mismatch).');
    }

    const id = crypto.randomUUID();

    return {
        id,
        originalName: file.name,
        buffer: arrayBuffer,
        size: file.size,
        type: file.type
    };
}
