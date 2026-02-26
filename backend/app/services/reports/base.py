class BaseReportBuilder:
    def __init__(self, db, filters):
        self.db = db
        self.filters = filters

    def build(self):
        raise NotImplementedError("Report builders must implement build()")