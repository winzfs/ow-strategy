import os
import json
import requests
from datetime import datetime

# 1. 관리자님 검수 완료 ID 명단
PRO_PLAYERS = {
    "안스 (Ans)": "UC7g2JNSc0SefzMTyc--Nn4w",
    "류제홍 (Ryujehong)": "UCtt0Hg9MhraTkzWwNQpplHg",
    "학살 (Haksal)": "UC8f4_B985QvM_S3m5v7zW2g",
    "립 (Lip)": "UC7-Q_vW1V06Y_X7V_S37N-A"
}

STREAMERS = {
    "미라지": "UC69SOf9BovX2uS_vGId07Pw",
    "빅헤드": "UCVp69S_pU6sgvS_uL5u-4_w"
}

API_KEY = os.environ.get('YOUTUBE_API_KEY')

def get_video(name, cid):
    if not API_KEY: return None
    uid = "UU" + cid[2:]
    url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={uid}&maxResults=1&key={API_KEY}"
    try:
        res = requests.get(url, timeout=10).json()
        if 'items' in res and len(res['items']) > 0:
            item = res['items'][0]['snippet']
            return {"id": item['resourceId']['videoId'], "title": item['title'], "player": name}
        
        # UU 실패 시 검색으로 2차 시도
        search_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&channelId={cid}&maxResults=1&order=date&type=video&key={API_KEY}"
        s_res = requests.get(search_url, timeout=10).json()
        if 'items' in s_res and len(s_res['items']) > 0:
            item = s_res['items'][0]
            return {"id": item['id']['videoId'], "title": item['snippet']['title'], "player": name}
    except: return None

# [추가된 기능] 검색어로 여러 영상을 가져오는 함수
def get_category_videos(query, label, count=6):
    if not API_KEY: return []
    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={query}&maxResults={count}&order=date&type=video&key={API_KEY}"
    try:
        res = requests.get(url, timeout=10).json()
        return [{"id": i['id']['videoId'], "title": i['snippet']['title'], "player": label} for i in res.get('items', [])]
    except: return []

def main():
    print("🚀 전체 카테고리 수집 시작 (Pro, Streamer, Official, Trending)...")
    data = {
        "lastUpdated": datetime.now().strftime('%Y-%m-%d %H:%M'),
        "pro": [], "streamer": [], "official": [], "trending": []
    }

    # 1. 프로 선수 (정확한 ID 기반)
    for name, cid in PRO_PLAYERS.items():
        v = get_video(name, cid)
        if v: data["pro"].append(v)

    # 2. 스트리머
    for name, cid in STREAMERS.items():
        v = get_video(name, cid)
        if v: data["streamer"].append(v)

    # 3. 공식 영상 (오버워치 공식 채널 소식)
    # '오버워치 2' 키워드로 최신 공식 뉴스를 검색합니다.
    data["official"] = get_category_videos("오버워치 2 공식", "Official", 6)

    # 4. 인기 영상 (최신 하이라이트 및 트렌딩)
    data["trending"] = get_category_videos("오버워치 2 하이라이트", "Trending", 6)

    with open('news.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"🎉 모든 카테고리 수집 완료! (Pro: {len(data['pro'])}, Streamer: {len(data['streamer'])}, Official: {len(data['official'])}, Trending: {len(data['trending'])})")

if __name__ == "__main__":
    main()
