import os
import json
import requests
from datetime import datetime

# 1. 관리자님이 넣으신 ID 리스트 (여기에 계속 추가하세요)
PRO_PLAYERS = {
    "학살 (Haksal)": "UC8f4_B985QvM_S3m5v7zW2g",
    "류제홍 (Ryujehong)": "UC0h_uVqO_JInU6LzT_N6_NQ",
    "안스 (Ans)": "UC9ghJjR2aiuvhudqw8dM__g",
    "립 (Lip)": "UC7-Q_vW1V06Y_X7V_S37N-A",
    "쪼낙 (Jjonak)": "UC6_868B7Xv_M3qfQ894569A"
}

STREAMERS = {
    "미라지": "UC69SOf9BovX2uS_vGId07Pw"
}

API_KEY = os.environ.get('YOUTUBE_API_KEY')

def get_latest(name, cid):
    # 가장 확실한 '업로드 재생목록' 조회 방식
    playlist_id = "UU" + cid[2:]
    url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={playlist_id}&maxResults=1&key={API_KEY}"
    
    try:
        res = requests.get(url).json()
        if 'items' in res and len(res['items']) > 0:
            item = res['items'][0]['snippet']
            return {
                "id": item['resourceId']['videoId'],
                "title": item['title'],
                "player": name
            }
    except:
        return None
    return None

def main():
    # 비어있는 리스트로 시작
    final_data = {
        "lastUpdated": datetime.now().strftime('%Y-%m-%d %H:%M'),
        "pro": [],
        "streamer": [],
        "official": [],
        "trending": []
    }

    print("프로 영상 수집 중...")
    for name, cid in PRO_PLAYERS.items():
        v = get_latest(name, cid)
        if v:
            final_data["pro"].append(v) # 여기서 .append()를 써야 데이터가 쌓입니다!
            print(f"추가됨: {name}")

    print("스트리머 영상 수집 중...")
    for name, cid in STREAMERS.items():
        v = get_latest(name, cid)
        if v:
            final_data["streamer"].append(v)

    # ... 키워드 검색 코드 생략 (필요시 추가) ...

    # [중요] 모든 반복문이 '완전히 끝난 뒤'에 저장해야 합니다!
    with open('news.json', 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    print("파일 저장 완료!")

if __name__ == "__main__":
    main()
