__status__ = "Development"


def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        src="static",
        dest="mining_extension",
        require="mining_extension/main")]
