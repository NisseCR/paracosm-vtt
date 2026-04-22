from pathlib import Path

from app.models.library import AmbienceFolder, AmbienceTrack, MusicPlaylist, MusicTrack


class AudioService:
    """
    Handle audio file discovery for music playlists and ambience folders.

    Music is expected to be stored as MP3 files and ambience as OGG files.
    """

    def __init__(self, music_dir: Path, ambience_dir: Path) -> None:
        self.music_dir = music_dir
        self.ambience_dir = ambience_dir

    def scan_music_playlists(self) -> list[MusicPlaylist]:
        """
        Scan the music directory for playlist folders and MP3 tracks.

        Returns:
            A list of discovered music playlists.
        """
        if not self.music_dir.exists():
            return []

        playlists: list[MusicPlaylist] = []

        for playlist_dir in sorted(path for path in self.music_dir.iterdir() if path.is_dir()):
            tracks = [
                MusicTrack(
                    name=track.stem,
                    file_name=track.name,
                    file_path=str(track.relative_to(self.music_dir.parent)),
                    url=f"/static/{track.relative_to(self.music_dir.parent).as_posix()}",
                )
                for track in sorted(playlist_dir.iterdir())
                if track.is_file() and track.suffix.lower() == ".mp3"
            ]

            cover_file = playlist_dir / "cover.jpg"
            cover_url = (
                f"/static/{cover_file.relative_to(self.music_dir.parent).as_posix()}"
                if cover_file.exists()
                else None
            )

            playlists.append(
                MusicPlaylist(
                    id=playlist_dir.name,
                    name=self._format_label(playlist_dir.name),
                    cover_url=cover_url,
                    tracks=tracks,
                )
            )

        return playlists

    def scan_ambience_folders(self) -> list[AmbienceFolder]:
        """
        Scan the ambience directory for category folders and OGG files.

        Returns:
            A list of discovered ambience folders.
        """
        if not self.ambience_dir.exists():
            return []

        folders: list[AmbienceFolder] = []

        for ambience_dir in sorted(path for path in self.ambience_dir.iterdir() if path.is_dir()):
            tracks = [
                AmbienceTrack(
                    name=track.stem,
                    file_name=track.name,
                    file_path=str(track.relative_to(self.ambience_dir.parent)),
                    url=f"/static/{track.relative_to(self.ambience_dir.parent).as_posix()}",
                )
                for track in sorted(ambience_dir.iterdir())
                if track.is_file() and track.suffix.lower() == ".ogg"
            ]

            folders.append(
                AmbienceFolder(
                    id=ambience_dir.name,
                    name=self._format_label(ambience_dir.name),
                    tracks=tracks,
                )
            )

        return folders

    def _format_label(self, raw_name: str) -> str:
        """
        Convert a snake_case folder name into a UI-friendly title.

        Args:
            raw_name: The folder name to format.

        Returns:
            A human-friendly display label.
        """
        return raw_name.replace("_", " ").title()