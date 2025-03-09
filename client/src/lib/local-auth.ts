import { Device } from '@capacitor/device';

export async function checkBiometricAvailability() {
  try {
    const info = await Device.getInfo();
    // Check if we're on Android and if the SDK version supports biometric
    const hasSystemBiometrics = info.platform === 'android' && info.androidSDKVersion >= 23;
    return { 
      isAvailable: hasSystemBiometrics,
      biometryType: hasSystemBiometrics ? 'fingerprint' : null
    };
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return { isAvailable: false, biometryType: null };
  }
}

export async function authenticateWithBiometric() {
  try {
    // For now, simulate biometric auth success
    // In production, this would use the actual biometric API
    return true;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean) {
  localStorage.setItem('biometricEnabled', enabled.toString());
}

export async function isBiometricEnabled() {
  return localStorage.getItem('biometricEnabled') === 'true';
}