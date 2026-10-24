import math
import struct
import wave

SAMPLE_RATE = 44100

def get_freq(note_name):
    # Base A4 = 440 Hz
    note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    name = note_name[:-1]
    octave = int(note_name[-1])
    semitone = note_names.index(name)
    # C0 is 12*0 + 0 = 0; A4 is octave 4, semitone 9 -> 4*12 + 9 = 57
    note_num = octave * 12 + semitone
    a4_num = 4 * 12 + 9
    return 440.0 * (2.0 ** ((note_num - a4_num) / 12.0))

# Canon in D chord progression (each chord 2 bars or 4 beats)
# Chords: D - A - Bm - F#m - G - D - G - A
BPM = 72
BEAT = 60.0 / BPM  # ~0.833 sec per beat
TOTAL_BEATS = 64
TOTAL_DURATION = TOTAL_BEATS * BEAT + 3.0  # extra for reverb ringout
TOTAL_SAMPLES = int(SAMPLE_RATE * TOTAL_DURATION)

buffer_l = [0.0] * TOTAL_SAMPLES
buffer_r = [0.0] * TOTAL_SAMPLES

def add_piano_note(note, start_time, duration, volume=0.5, pan=0.0):
    freq = get_freq(note)
    start_sample = int(start_time * SAMPLE_RATE)
    num_samples = int(duration * SAMPLE_RATE)
    
    # Harmonics profile for acoustic piano / music box
    # [harmonic_mult, amplitude_mult, decay_factor]
    harmonics = [
        (1.0, 1.0, 1.0),
        (2.0, 0.55, 1.2),
        (3.0, 0.30, 1.4),
        (4.0, 0.18, 1.7),
        (5.0, 0.10, 2.0),
        (6.0, 0.05, 2.4),
        (7.0, 0.02, 3.0),
    ]
    
    pan_l = math.cos((pan + 1.0) * math.pi / 4.0)
    pan_r = math.sin((pan + 1.0) * math.pi / 4.0)
    
    decay_rate = 1.6 / max(0.5, duration)
    
    for i in range(num_samples):
        idx = start_sample + i
        if idx >= TOTAL_SAMPLES:
            break
        t = i / SAMPLE_RATE
        
        # Attack envelope (smooth 12ms attack)
        if t < 0.012:
            env = t / 0.012
        else:
            env = math.exp(-(t - 0.012) * decay_rate)
            
        # Add slight release damping
        if t > duration - 0.05:
            rel = (duration - t) / 0.05
            env *= max(0.0, rel)
            
        sample_val = 0.0
        for h_mult, h_amp, h_decay in harmonics:
            h_env = math.exp(-t * decay_rate * h_decay)
            # subtle detune for warmth
            sample_val += math.sin(2.0 * math.pi * freq * h_mult * t) * h_amp * h_env
            sample_val += 0.15 * math.sin(2.0 * math.pi * (freq * h_mult * 1.001) * t) * h_amp * h_env
            
        val = sample_val * env * volume * 0.18
        buffer_l[idx] += val * pan_l
        buffer_r[idx] += val * pan_r

# Build Canon in D sequence
# Chords in 8-measure cycles (D, A, Bm, F#m, G, D, G, A)
# Loop 1: Bass + gentle arpeggios
# Loop 2: Melody 1 (classic Canon theme)
# Loop 3: Melody variation

bass_roots = ['D2', 'A1', 'B1', 'F#1', 'G1', 'D1', 'G1', 'A1']
chords = [
    ['D3', 'F#3', 'A3', 'D4'],   # D
    ['A2', 'E3', 'A3', 'C#4'],    # A
    ['B2', 'D3', 'F#3', 'B3'],    # Bm
    ['F#2', 'C#3', 'F#3', 'A3'],  # F#m
    ['G2', 'D3', 'G3', 'B3'],     # G
    ['D2', 'A2', 'D3', 'F#3'],    # D
    ['G2', 'D3', 'G3', 'B3'],     # G
    ['A2', 'E3', 'A3', 'C#4']     # A
]

# Section 1: Intro arpeggio (Measures 1-8, beats 0 to 31)
for m in range(8):
    m_time = m * 4 * BEAT
    bass = bass_roots[m]
    chord = chords[m]
    # Bass note
    add_piano_note(bass, m_time, BEAT * 3.8, volume=0.7, pan=-0.3)
    # Arpeggio pattern: 4 eighth notes
    for step in range(4):
        n = chord[step % len(chord)]
        add_piano_note(n, m_time + step * BEAT, BEAT * 1.8, volume=0.45, pan=0.1 * step - 0.15)

# Section 2: Famous Canon Melody enters (Measures 9-16, beats 32 to 63)
melody_notes = [
    # Meas 9: D chord -> F#5, E5
    ('F#5', 0.0, 2.0), ('E5', 2.0, 2.0),
    # Meas 10: A chord -> D5, C#5
    ('D5', 4.0, 2.0), ('C#5', 6.0, 2.0),
    # Meas 11: Bm chord -> B4, A4
    ('B4', 8.0, 2.0), ('A4', 10.0, 2.0),
    # Meas 12: F#m chord -> B4, C#5
    ('B4', 12.0, 2.0), ('C#5', 14.0, 2.0),
    # Meas 13: G chord -> D5, C#5
    ('D5', 16.0, 2.0), ('C#5', 18.0, 2.0),
    # Meas 14: D chord -> B4, A4
    ('B4', 20.0, 2.0), ('A4', 22.0, 2.0),
    # Meas 15: G chord -> G4, F#4
    ('G4', 24.0, 2.0), ('F#4', 26.0, 2.0),
    # Meas 16: A chord -> E4, (resolve to D)
    ('E4', 28.0, 2.0), ('D4', 30.0, 2.0)
]

for m in range(8):
    m_time = (8 + m) * 4 * BEAT
    bass = bass_roots[m]
    chord = chords[m]
    # Bass
    add_piano_note(bass, m_time, BEAT * 3.8, volume=0.75, pan=-0.3)
    # Flowing broken chord accompaniment (8 eighth notes per measure)
    for step in range(8):
        n = chord[step % len(chord)]
        add_piano_note(n, m_time + step * (BEAT * 0.5), BEAT * 1.2, volume=0.35, pan=0.15 * (step % 4 - 1.5))

# Add melody
for note, b_offset, b_dur in melody_notes:
    t = 32 * BEAT + b_offset * BEAT
    add_piano_note(note, t, b_dur * BEAT * 1.1, volume=0.85, pan=0.25)
    # Harmony third below
    # Add gentle chime resonance an octave higher
    oct_up = note[:-1] + str(int(note[-1]) + 1)
    add_piano_note(oct_up, t + 0.02, b_dur * BEAT * 0.8, volume=0.25, pan=0.4)

# Final chord resolution on D Major (Measures 17)
final_time = 64 * BEAT
add_piano_note('D2', final_time, 4.0, volume=0.7, pan=-0.3)
add_piano_note('D3', final_time, 4.0, volume=0.5, pan=-0.1)
add_piano_note('F#3', final_time, 4.0, volume=0.5, pan=0.0)
add_piano_note('A3', final_time, 4.0, volume=0.5, pan=0.1)
add_piano_note('D4', final_time, 4.0, volume=0.6, pan=0.2)
add_piano_note('F#4', final_time, 4.0, volume=0.6, pan=0.3)

# Apply Stereo Reverb (Comb filters & Allpass diffusion for warm cathedral hall acoustics)
print("Applying cathedral acoustics...")
delay_samples_l = int(SAMPLE_RATE * 0.088)
delay_samples_r = int(SAMPLE_RATE * 0.095)
feedback = 0.42

for i in range(TOTAL_SAMPLES):
    if i >= delay_samples_l:
        buffer_l[i] += buffer_l[i - delay_samples_l] * feedback
    if i >= delay_samples_r:
        buffer_r[i] += buffer_r[i - delay_samples_r] * feedback

# Normalize
max_val = max(max(abs(s) for s in buffer_l), max(abs(s) for s in buffer_r), 0.001)
print(f"Max peak: {max_val:.3f}, normalizing to -1.0dB...")
target_peak = 0.88
gain = target_peak / max_val

# Write to WAV file
out_path = "assets/audio/canon_in_d.wav"
with wave.open(out_path, 'w') as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)  # 16-bit
    wf.setframerate(SAMPLE_RATE)
    
    frames = bytearray()
    for l, r in zip(buffer_l, buffer_r):
        sl = int(max(-32767, min(32767, l * gain * 32767.0)))
        sr = int(max(-32767, min(32767, r * gain * 32767.0)))
        frames.extend(struct.pack('<hh', sl, sr))
    wf.writeframes(frames)

print(f"Successfully generated {out_path} ({TOTAL_DURATION:.1f}s)")
