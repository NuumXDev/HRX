import os
from serpapi import GoogleSearch

class SerpAPITool:
    """Wrapper around SerpAPI for social media and background web verifications."""
    
    def __init__(self):
        self.api_key = os.getenv("SERPAPI_KEY")

    def search(self, query: str, num_results: int = 3) -> dict:
        """Execute a standard Google search via SerpAPI."""
        if not self.api_key:
            return {"error": "SERPAPI_KEY not found in environment."}
        
        params = {
            "engine": "google",
            "q": query,
            "api_key": self.api_key,
            "num": num_results
        }
        
        try:
            search = GoogleSearch(params)
            results = search.get_dict()
            
            organic_results = results.get("organic_results", [])
            formatted_results = []
            
            for result in organic_results:
                formatted_results.append({
                    "title": result.get("title", ""),
                    "link": result.get("link", ""),
                    "snippet": result.get("snippet", "")
                })
            return {"results": formatted_results}
        except Exception as e:
            return {"error": str(e)}

    def search_linkedin(self, full_name: str) -> dict:
        """Helper specifically for finding LinkedIn profiles."""
        query = f"site:linkedin.com/in/ \"{full_name}\""
        return self.search(query, num_results=2)

    def search_github(self, full_name: str) -> dict:
        """Helper specifically for finding GitHub profiles/projects."""
        query = f"site:github.com \"{full_name}\""
        return self.search(query, num_results=2)

    def search_exact_url(self, url: str) -> dict:
        """Helper to search an exact social media URL to extract its snippet."""
        # Clean protocol and trailing slashes for an exact site search
        clean_url = url.replace("https://", "").replace("http://", "").replace("www.", "").strip()
        if clean_url:
            query = f"site:{clean_url}"
        else:
            query = url
        return self.search(query, num_results=1)
