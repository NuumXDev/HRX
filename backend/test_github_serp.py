import os
from dotenv import load_dotenv
from app.engine.tools.serpapi import SerpAPITool

load_dotenv()
tool = SerpAPITool()
res = tool.search_exact_url("https://github.com/Sompandey01")
print(res)

