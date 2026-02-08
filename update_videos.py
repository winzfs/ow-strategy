import os
import json
import requests
from datetime import datetime

# 1. 관리자님이 ID를 직접 추가할 리스트
PRO_PLAYERS = {
    "학살 (Haksal)": "UC8f4_B985QvM_S3m5v7zW2g",
    "류제홍 (Ryujehong)": "UC0h_uVqO_JInU6LzT_N6_NQ",
    "안스 (Ans)": "UC9ghJjR2aiuvhudqw8dM__g",
    "립 (Lip)": "UC7-Q_vW1V06Y_X7V_S37N-A"
    # 여기에 계속 "이름": "ID" 형식으로 추가하세요.
}

STREAMERS = {
    "미라지": "UC69SOf9BovX2uS_vGId07Pw",
    "빅헤드": "UCVp69S_pU6sgvS_uL5u-4_w"
    # 스트리머 채널 ID도 여기에 추가하세요.
}

# 2. 키워드로 자동 검색할 리스트 (검색어 'q'를 수정해서 검색 품질을 조절하세요)
AUTO_CATEGORIES = {
    "official": {"q": "오버워치 2 공식 소식 뉴스", "name": "Official"},
    "trending": {"q": "오버워치 2 오늘 인기 하이라이트", "name": "Trending"}
}

API_KEY = os.environ.get('YOUTUBE_API_KEY')

def fetch_data(url):
    try:
        res = requests.get(url)
        return res.json()
    except:
        return None

def get_video_info(item, label):
    return {
        "id": item['id']['videoId'],
        "title": item['snippet']['title'],
        "player": label
    }

def main():
    print("데이터 수집을 시작합니다...")
    
    # 결과 저장 구조
    result = {
        "lastUpdated": datetime.now().strftime('%Y-%m-%d %H:%M'),
        "pro": [],
        "streamer": [],
        "official": [],
        "trending": []
    }

    # A. 프로 선수 (ID 기반)
    for name, cid in PRO_PLAYERS.items():
        url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&channelId={cid}&maxResults=1&order=date&type=video&key={API_KEY}"
        data = fetch_data(url)
        if data and 'items' in data and data['items']:
            result["pro"].append(get_video_info(data['items'][0], name))

    # B. 스트리머 (ID 기반)
    for name, cid in STREAMERS.items():
        url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&channelId={cid}&maxResults=1&order=date&type=video&key={API_KEY}"
        data = fetch_data(url)
        if data and 'items' in data and data['items']:
            result["streamer"].append(get_video_info(data['items'][0], name))

    # C. 공식 & 인기 영상 (키워드 기반, 각 6개씩)
    for category, config in AUTO_CATEGORIES.items():
        url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={config['q']}&maxResults=6&order=date&type=video&key={API_KEY}"
        data = fetch_data(url)
        if data and 'items' in data:
            for item in data['items']:
                result[category].append(get_video_info(item, config['name']))

    # news.json 파일로 저장
    with open('news.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"업데이트 완료: {result['lastUpdated']}")

if __name__ == "__main__":
    main()
