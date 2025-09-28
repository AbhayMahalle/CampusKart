/**
 * WhatsApp Integration Utilities
 */

export interface WhatsAppMessage {
  phone: string;
  message: string;
}

/**
 * Opens WhatsApp with a pre-filled message
 */
export const openWhatsApp = ({ phone, message }: WhatsAppMessage) => {
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanedPhone = phone.replace(/\D/g, '');
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
  
  // Open in new tab
  window.open(whatsappUrl, '_blank');
};

/**
 * Generate WhatsApp message for product inquiry
 */
export const generateProductMessage = (productTitle: string, sellerName?: string) => {
  const greeting = sellerName ? `Hi ${sellerName}` : 'Hi';
  return `${greeting}, I'm interested in your item '${productTitle}' on CampusKart. Is it still available?`;
};

/**
 * Generate WhatsApp message for flat inquiry
 */
export const generateFlatMessage = (flatTitle: string, ownerName?: string) => {
  const greeting = ownerName ? `Hi ${ownerName}` : 'Hi';
  return `${greeting}, I saw your flat listing '${flatTitle}' on CampusKart. I'm interested in learning more about it.`;
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleanedPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (10-15 digits)
  return cleanedPhone.length >= 10 && cleanedPhone.length <= 15;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for 10-digit numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // For other lengths, just add spaces every 3 digits
  return cleaned.replace(/(\d{3})(?=\d)/g, '$1 ');
};