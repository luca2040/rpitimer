# server/flask/app/utils/Translations.py from my FilePapera server with some modifications

import json
import os

from .config import AppConfig


class Translations:
    def __init__(self):
        self.translations = {}

    def load(self, app_cfg: AppConfig):
        """The path is the dir where the json files of the translations are.
        Load into memory all the translations from the path"""
        self.path = app_cfg.locale_path
        self.default = app_cfg.default_locale

        for filename in os.listdir(self.path):
            if filename.endswith(".json"):
                lang = filename.split(".")[0]
                complete_path = os.path.join(self.path, filename)

                with open(complete_path, "r", encoding="utf-8") as file:
                    self.translations[lang] = json.load(file)

    def available_langs(self):
        """Returns a list of available langs"""
        return list(self.translations.keys())

    def get(self, lang: str):
        """Returns the specified lang dict"""
        lang_to_get = lang if lang in self.translations else self.default

        return self.translations[lang_to_get]


translations: Translations = Translations()
