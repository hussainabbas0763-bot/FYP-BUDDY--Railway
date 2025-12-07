// End-to-End Encryption Utilities
// Uses Web Crypto API for AES-256-GCM encryption

/**
 * Derives a shared encryption key for a chat room
 * This ensures all participants can encrypt/decrypt messages
 */
export async function deriveRoomKey(roomKey, userId, participants = []) {
    try {
        // Create a deterministic key material from room and participants
        const participantIds = [...participants]
            .map((p) => (typeof p === 'object' ? p.id || p._id : p))
            .filter(Boolean)
            .sort()
            .join(',');

        const keyMaterial = `${roomKey}:${participantIds}`;

        // Convert to ArrayBuffer
        const encoder = new TextEncoder();
        const data = encoder.encode(keyMaterial);

        // Import key material
        const keyMaterialCrypto = await crypto.subtle.importKey(
            'raw',
            data,
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        // Derive key using PBKDF2
        const salt = encoder.encode('chat-encryption-salt-v1'); // Fixed salt for deterministic key
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256',
            },
            keyMaterialCrypto,
            256 // 256 bits = 32 bytes for AES-256
        );

        // Import as AES-GCM key
        const key = await crypto.subtle.importKey(
            'raw',
            derivedBits,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );

        return key;
    } catch (error) {
        console.error('Error deriving room key:', error);
        throw new Error('Failed to derive encryption key');
    }
}

/**
 * Encrypts data using AES-256-GCM
 */
export async function encryptData(data, key) {
    try {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));

        // Generate a random IV (Initialization Vector) for each encryption
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Encrypt the data
        const encryptedData = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: 128, // 128-bit authentication tag
            },
            key,
            dataBuffer
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encryptedData.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedData), iv.length);

        // Convert to base64 for storage/transmission
        const base64 = btoa(String.fromCharCode(...combined));

        return base64;
    } catch (error) {
        console.error('Error encrypting data:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypts data using AES-256-GCM
 */
export async function decryptData(encryptedBase64, key) {
    try {
        // Convert base64 back to Uint8Array
        const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

        // Extract IV (first 12 bytes) and encrypted data
        const iv = combined.slice(0, 12);
        const encryptedData = combined.slice(12);

        // Decrypt the data
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: 128,
            },
            key,
            encryptedData
        );

        // Convert to string
        const decoder = new TextDecoder();
        const decryptedText = decoder.decode(decryptedBuffer);

        // Try to parse as JSON, if it fails return as string
        try {
            return JSON.parse(decryptedText);
        } catch {
            return decryptedText;
        }
    } catch (error) {
        console.error('Error decrypting data:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Encrypts a message object (text, attachments, contactData)
 */
export async function encryptMessage(message, roomKey, userId, participants) {
    try {
        const key = await deriveRoomKey(roomKey, userId, participants);
        const encryptedMessage = { ...message };

        // Encrypt text if present (even if empty string, encrypt it if it exists)
        if (encryptedMessage.text !== undefined && encryptedMessage.text !== null) {
            encryptedMessage.text = encryptedMessage.text.trim()
                ? await encryptData(encryptedMessage.text.trim(), key)
                : "";
        }

        // Encrypt attachments (URLs and metadata)
        if (encryptedMessage.attachments && Array.isArray(encryptedMessage.attachments)) {
            encryptedMessage.attachments = await Promise.all(
                encryptedMessage.attachments.map(async (attachment) => {
                    const encryptedAttachment = { ...attachment };
                    if (encryptedAttachment.url) {
                        encryptedAttachment.url = await encryptData(encryptedAttachment.url, key);
                    }
                    if (encryptedAttachment.fileName) {
                        encryptedAttachment.fileName = await encryptData(encryptedAttachment.fileName, key);
                    }
                    return encryptedAttachment;
                })
            );
        }

        // Encrypt contact data
        if (encryptedMessage.contactData) {
            const encryptedContact = {};
            if (encryptedMessage.contactData.userId) {
                encryptedContact.userId = encryptedMessage.contactData.userId; // Keep ID unencrypted for reference
            }
            if (encryptedMessage.contactData.username) {
                encryptedContact.username = await encryptData(encryptedMessage.contactData.username, key);
            }
            if (encryptedMessage.contactData.email) {
                encryptedContact.email = await encryptData(encryptedMessage.contactData.email, key);
            }
            if (encryptedMessage.contactData.phone) {
                encryptedContact.phone = await encryptData(encryptedMessage.contactData.phone, key);
            }
            encryptedMessage.contactData = encryptedContact;
        }

        // Mark as encrypted
        encryptedMessage.isEncrypted = true;

        return encryptedMessage;
    } catch (error) {
        console.error('Error encrypting message:', error);
        throw error;
    }
}

/**
 * Decrypts a message object
 */
export async function decryptMessage(message, roomKey, userId, participants) {
    try {
        // If message is not encrypted, return as is
        if (!message.isEncrypted) {
            return message;
        }

        const key = await deriveRoomKey(roomKey, userId, participants);
        const decryptedMessage = { ...message };

        // Decrypt text if present
        if (decryptedMessage.text &&
            decryptedMessage.text !== 'This message was deleted' &&
            decryptedMessage.text.trim()) {
            try {
                // Check if it looks like encrypted data (base64)
                if (decryptedMessage.text.length > 20 && /^[A-Za-z0-9+/=]+$/.test(decryptedMessage.text)) {
                    decryptedMessage.text = await decryptData(decryptedMessage.text, key);
                }
                // If it doesn't look encrypted, assume it's plain text (backward compatibility)
            } catch (error) {
                console.error('Error decrypting text:', error);
                decryptedMessage.text = '[Encrypted message - decryption failed]';
            }
        }

        // Decrypt attachments
        if (decryptedMessage.attachments && Array.isArray(decryptedMessage.attachments)) {
            decryptedMessage.attachments = await Promise.all(
                decryptedMessage.attachments.map(async (attachment) => {
                    const decryptedAttachment = { ...attachment };
                    try {
                        if (decryptedAttachment.url) {
                            // Check if URL looks encrypted (base64, not starting with http)
                            if (!decryptedAttachment.url.startsWith('http') &&
                                /^[A-Za-z0-9+/=]+$/.test(decryptedAttachment.url)) {
                                decryptedAttachment.url = await decryptData(decryptedAttachment.url, key);
                            }
                        }
                        if (decryptedAttachment.fileName) {
                            // Check if fileName looks encrypted
                            if (!decryptedAttachment.fileName.includes('.') &&
                                /^[A-Za-z0-9+/=]+$/.test(decryptedAttachment.fileName)) {
                                decryptedAttachment.fileName = await decryptData(decryptedAttachment.fileName, key);
                            }
                        }
                    } catch (error) {
                        console.error('Error decrypting attachment:', error);
                    }
                    return decryptedAttachment;
                })
            );
        }

        // Decrypt contact data
        if (decryptedMessage.contactData) {
            const decryptedContact = { ...decryptedMessage.contactData };
            try {
                if (decryptedContact.username) {
                    // Check if username looks encrypted
                    if (/^[A-Za-z0-9+/=]+$/.test(decryptedContact.username) &&
                        decryptedContact.username.length > 20) {
                        decryptedContact.username = await decryptData(decryptedContact.username, key);
                    }
                }
                if (decryptedContact.email) {
                    // Check if email looks encrypted (doesn't contain @)
                    if (!decryptedContact.email.includes('@') &&
                        /^[A-Za-z0-9+/=]+$/.test(decryptedContact.email)) {
                        decryptedContact.email = await decryptData(decryptedContact.email, key);
                    }
                }
                if (decryptedContact.phone) {
                    // Check if phone looks encrypted (not just digits)
                    if (!/^\d+$/.test(decryptedContact.phone) &&
                        /^[A-Za-z0-9+/=]+$/.test(decryptedContact.phone)) {
                        decryptedContact.phone = await decryptData(decryptedContact.phone, key);
                    }
                }
                decryptedMessage.contactData = decryptedContact;
            } catch (error) {
                console.error('Error decrypting contact data:', error);
            }
        }

        // Remove encryption flag
        delete decryptedMessage.isEncrypted;

        return decryptedMessage;
    } catch (error) {
        console.error('Error decrypting message:', error);
        return message; // Return original message if decryption fails
    }
}
