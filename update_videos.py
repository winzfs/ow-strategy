import os
import json
import requests
from datetime import datetime

# 선수 및 스트리머 명단
PRO_PLAYERS = {
    "안스 (Ans)": "UC9ghJjR2aiuvhudqw8dM__g",
    "학살 (Haksal)": "UC8f4_B985QvM_S3m5v7zW2g",
    "류제홍 (Ryujehong)": "UC0h_uVqO_JInU6LzT_N6_NQ",
    "립 (Lip)": "UC7-Q_vW1V06Y_X7V_S37N-A"
}

STREAMERS = {
    "미라지": "UC69SOf9BovX2uS_vGId07Pw",
    "빅헤드": "UCVp69S_pU6sgvS_uL5u-4_w"
}

API_KEY = os.environ.get('YOUTUBE_API_KEY')

def get_latest_by_search(name, channel_id):
    if not API_KEY: return None
    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&channelId={channel_id}&maxResults=1&order=date&type=video&key={API_KEY}"
    try:
        res = requests.get(url, timeout=10).json()
        if 'items' in res and len(res['items']) > 0:
            item = res['items'][0]
            return {"id": item['id']['videoId'], "title": item['snippet']['title'], "player": name}
    except: return None
    return None

def get_category_videos(query, label):
    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={query}&maxResults=6&order=date&type=video&key={API_KEY}"
    try:
        res = requests.get(url, timeout=10).json()
        return [{"id": i['id']['videoId'], "title": i['snippet']['title'], "player": label} for i in res.get('items', [])]
    except: return []

def main():
    data = {
        "lastUpdated": datetime.now().strftime('%Y-%m-%d %H:%M'),
        "pro": [], "streamer": [], "official": [], "trending": []
    }
    # 데이터 수집 (반복문)
    for name, cid in PRO_PLAYERS.items():
        v = get_latest_by_search(name, cid)
        if v: data["pro"].append(v)
    for name, cid in STREAMERS.items():
        v = get_latest_by_search(name, cid)
        if v: data["streamer"].append(v)
    
    data["official"] = get_category_videos("오버워치2 공식 채널 소식", "Official")
    data["trending"] = get_category_videos("오버워치2 하이라이트", "Trending")

    with open('news.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
