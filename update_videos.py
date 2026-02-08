import os
import json
import requests
from datetime import datetime

# 1. 선수 및 스트리머 명단 (반드시 UC로 시작하는 채널 ID)
PRO_PLAYERS = {
    "안스 (Ans)": "UC9ghJjR2aiuvhudqw8dM__g",
    "학살 (Haksal)": "UC8f4_B985QvM_S3m5v7zW2g",
    "류제홍 (Ryujehong)": "UC0h_uVqO_JInU6LzT_N6_NQ",
    "립 (Lip)": "UC7-Q_vW1V06Y_X7V_S37N-A",
    "쪼낙 (Jjonak)": "UC6_868B7Xv_M3qfQ894569A"
}

STREAMERS = {
    "미라지": "UC69SOf9BovX2uS_vGId07Pw",
    "빅헤드": "UCVp69S_pU6sgvS_uL5u-4_w"
}

API_KEY = os.environ.get('YOUTUBE_API_KEY')

def get_latest_from_uploads(name, channel_id):
    if not API_KEY: return None
    
    # UC... 를 UU... 로 변환 (업로드 재생목록 ID)
    upload_playlist_id = "UU" + channel_id[2:]
    url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={upload_playlist_id}&maxResults=1&key={API_KEY}"
    
    try:
        res = requests.get(url, timeout=10).json()
        if 'items' in res and len(res['items']) > 0:
            item = res['items'][0]['snippet']
            return {
                "id": item['resourceId']['videoId'],
                "title": item['title'],
                "player": name
            }
    except Exception as e:
        print(f"Error ({name}): {e}")
    return None

def main():
    print("🚀 UU 재생목록 방식 수집 시작...")
    data = {
        "lastUpdated": datetime.now().strftime('%Y-%m-%d %H:%M'),
        "pro": [], "streamer": [], "official": [], "trending": []
    }

    # 프로 선수 수집
    for name, cid in PRO_PLAYERS.items():
        v = get_latest_from_uploads(name, cid)
        if v: 
            data["pro"].append(v)
            print(f"✅ 프로 추가: {name}")

    # 스트리머 수집
    for name, cid in STREAMERS.items():
        v = get_latest_from_uploads(name, cid)
        if v: 
            data["streamer"].append(v)
            print(f"✅ 스트리머 추가: {name}")

    # (참고) 공식/트렌딩은 특정 채널이 아니므로 기존 search 방식을 사용하거나 
    # 오버워치 공식 채널 ID를 넣어 위와 같은 방식으로 처리할 수 있습니다.

    with open('news.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("🎉 news.json 저장 완료!")

if __name__ == "__main__":
    main()
