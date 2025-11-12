import { createAudioPlayer } from 'expo-audio';

// Tiny base64-encoded WAV fallbacks (in case assets are placeholders or missing)
const BEEP_FALLBACK = 'data:audio/wav;base64,UklGRm4AAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YYIAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAf39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f38=';
const BEEP2_FALLBACK = BEEP_FALLBACK; // distinct tone optional; keeping simple

/**
 * Play audio from a source with fallback support
 * Uses Audio.Sound.createAsync if available (compatibility), otherwise uses createAudioPlayer
 * @param source - Primary audio source (asset or URI)
 * @param fallbackDataUri - Fallback base64 data URI if primary fails
 * @param debugName - Optional name for debugging/logging
 */
async function playFromSource(source: any, fallbackDataUri: string, debugName?: string) {
  try {
    const player = createAudioPlayer(source);
    player.play();
    setTimeout(() => player.remove(), 4000);
    return;
  } catch (primaryError) {
    if (debugName) {
      console.warn(`[Audio] Primary source failed for ${debugName}, trying fallback:`, primaryError);
    }
  }
  try {
    const player = createAudioPlayer({ uri: fallbackDataUri });
    player.play();
    setTimeout(() => player.remove(), 4000);
  } catch (fallbackError) {
    if (debugName) {
      console.error(`[Audio] Failed to play ${debugName} (both primary and fallback failed):`, fallbackError);
    }
  }
}

/**
 * Play beep sound (used for task completion)
 * Tries bundled asset first, then falls back to base64 data URI
 */
export async function playBeep() {
  try {
    // @ts-ignore: require resolves static asset
    const asset = require('../../assets/beep.mp3');
    await playFromSource(asset, BEEP_FALLBACK, 'beep');
  } catch (error) {
    await playFromSource({ uri: BEEP_FALLBACK }, BEEP_FALLBACK, 'beep (fallback only)');
  }
}

/**
 * Play beep2 sound (used for journal entry creation)
 * Tries bundled asset first, then falls back to base64 data URI
 */
export async function playBeep2() {
  try {
    // @ts-ignore: require resolves static asset
    const asset = require('../../assets/beep2.mp3');
    await playFromSource(asset, BEEP2_FALLBACK, 'beep2');
  } catch (error) {
    await playFromSource({ uri: BEEP2_FALLBACK }, BEEP2_FALLBACK, 'beep2 (fallback only)');
  }
}

/**
 * Play inhale sound (used for breathing exercises)
 * Tries bundled asset first, then falls back to base64 data URI
 */
export async function playInhale() {
  try {
    // @ts-ignore: require resolves static asset
    const asset = require('../../assets/inhale.wav');
    await playFromSource(asset, BEEP_FALLBACK, 'inhale');
  } catch (error) {
    await playFromSource({ uri: BEEP_FALLBACK }, BEEP_FALLBACK, 'inhale (fallback only)');
  }
}

/**
 * Play exhale sound (used for breathing exercises)
 * Tries bundled asset first, then falls back to base64 data URI
 */
export async function playExhale() {
  try {
    // @ts-ignore: require resolves static asset
    const asset = require('../../assets/exhale.wav');
    await playFromSource(asset, BEEP_FALLBACK, 'exhale');
  } catch (error) {
    await playFromSource({ uri: BEEP_FALLBACK }, BEEP_FALLBACK, 'exhale (fallback only)');
  }
}

/**
 * Play change sound (used for breathing exercise holds)
 * Tries bundled asset first, then falls back to base64 data URI
 */
export async function playChange() {
  try {
    // @ts-ignore: require resolves static asset
    const asset = require('../../assets/change.wav');
    await playFromSource(asset, BEEP_FALLBACK, 'change');
  } catch (error) {
    await playFromSource({ uri: BEEP_FALLBACK }, BEEP_FALLBACK, 'change (fallback only)');
  }
}
