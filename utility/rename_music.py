import os
import re
from pathlib import Path

def to_kebab_case(name):
    # Remove extension for name conversion
    stem = Path(name).stem
    suffix = Path(name).suffix
    
    # Replace non-alphanumeric (except . and -) with space
    s = re.sub(r'[^a-zA-Z0-9\.]', ' ', stem)
    # Convert to lowercase and split into words
    words = s.lower().split()
    # Join with hyphens
    return '-'.join(words) + suffix.lower()

def rename_music_files():
    music_dir = Path('../static/assets/audio/music')
    if not music_dir.exists():
        print(f'Error: {music_dir} does not exist')
        return

    for playlist_folder in music_dir.iterdir():
        if not playlist_folder.is_dir():
            continue
        
        print(f'Processing playlist: {playlist_folder.name}')
        for track in playlist_folder.iterdir():
            if not track.is_file() or track.name == 'cover.jpg' or track.suffix.lower() not in {'.mp3', '.wav', '.ogg'}:
                continue
            
            new_name = to_kebab_case(track.name)
            if new_name != track.name:
                new_path = track.with_name(new_name)
                if new_path.exists():
                    print(f'  Warning: {new_path} already exists, skipping {track.name}')
                else:
                    print(f'  Renaming: {track.name} -> {new_name}')
                    track.rename(new_path)

if __name__ == "__main__":
    rename_music_files()
