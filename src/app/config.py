import os
from pathlib import Path

from dotenv import load_dotenv


class AppConfig:

    def __init__(self) -> None:
        self.is_rpizero: bool = False
        self.app_host: str = ""
        self.devices_path: str = ""
        self.timers_path: str = ""
        self.settings_path: str = ""
        self.locale_path: str = ""
        self.locale: str = ""
        self.default_locale: str = "en"
        self.swap_outputs: bool = False
        self.cycle_delay: int = -1
        self.main_folder: Path | None = None
        self.env_path: Path | None = None

    def load(self, main_path: Path) -> None:
        self.main_folder = main_path
        self.env_path = self.main_folder / ".env"

        load_dotenv(dotenv_path=self.env_path)

        self.is_rpizero = (os.getenv("IS_RPIZERO") or "0") == "1"

        self.app_host = os.getenv("APP_HOST") or "0.0.0.0"

        devices_tmp: Path = Path(os.getenv("DEVICES_PATH") or "config/devices.json")
        timers_tmp: Path = Path(os.getenv("TIMERS_PATH") or "config/timers.json")
        settings_tmp: Path = Path(os.getenv("SETTINGS_PATH") or "config/settings.json")
        locale_path_tmp: Path = Path(os.getenv("LOCALE_PATH") or "locale")

        # fmt: off
        self.devices_path = str(
            devices_tmp if devices_tmp.is_absolute() else self.main_folder / devices_tmp
        )
        self.timers_path = str(
            timers_tmp if timers_tmp.is_absolute() else self.main_folder / timers_tmp
        )
        self.settings_path = str(
            settings_tmp if settings_tmp.is_absolute() else self.main_folder / settings_tmp
        )
        self.locale_path = str(
            locale_path_tmp if locale_path_tmp.is_absolute() else self.main_folder / locale_path_tmp
        )
        # fmt: on

        self.locale = os.getenv("LOCALE") or self.default_locale
        self.swap_outputs = (os.getenv("SWAP_OUTPUTS") or "0") == "1"

        self.cycle_delay = int(os.getenv("CYCLE_DELAY") or "10")


app_config: AppConfig = AppConfig()
