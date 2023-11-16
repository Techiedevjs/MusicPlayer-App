import { writable } from 'svelte/store';

export const apiKey = "AIzaSyAZBDyql6dUFTy5ycIywsqPfOE92O3tEhk";
export const songs = writable([]);
export const selectedSongsFromQueue = writable([]);
export const currentSong = writable({});
export const currentTimeout = writable(0);
export const totalSongs = writable(0);
export const timeline = writable(0);
export const playActive = writable(false);