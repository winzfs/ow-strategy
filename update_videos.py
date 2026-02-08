import os
import json
import requests
from datetime import datetime

# 1. 선수 및 스트리머 명단
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

def get_video(name, channel_id):
    if not API_KEY: return None
    try:
        # UU 방식으로 변환
        playlist_id = "UU" + channel_id[2:]
        url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={playlist_id}&maxResults=1&key={API_KEY}"
        
        response = requests.get(url, timeout=10)
        res = response.json()
        
        # API 할당량 초과 시 에러 메시지 출력
        if 'error' in res:
            print(f"⚠️ API 에러 ({name}): {res['error']['message']}")
            return None

        if 'items' in res and len(res['items']) > 0:
            item = res['items'][0]['snippet']
            return {
                "id": item['resourceId']['videoId'],
                "title": item['title'],
                "player": name
            }
    except Exception as e:
        print(f"❌ 수행 에러 ({name}): {e}")
    return None

def main():
    # 데이터를 담을 빈 그릇 준비
    final_data = {
        "lastUpdated": datetime.now().strftime('%Y-%m-%d %H:%M'),
        "pro": [],
        "streamer": [],
        "official": [],
        "trending": []
    }

    print("🚀 데이터 수집을 시작합니다...")

    # 프로 선수 수집 (에러가 나도 계속 진행)
    for name, cid in PRO_PLAYERS.items():
        video = get_video(name, cid)
        if video:
            final_data["pro"].append(video) # 차곡차곡 쌓기
            print(f"✅ 추가 완료: {name}")
        else:
            print(f"⏩ 건너뜀: {name}")

    # 스트리머 수집
    for name, cid in STREAMERS.items():
        video = get_video(name, cid)
        if video:
            final_data["streamer"].append(video)
            print(f"✅ 추가 완료: {name}")

    # 파일 저장 (이 위치가 반복문 밖인지 꼭 확인하세요!)
    with open('news.json', 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print(f"🎉 작업 종료! 총 {len(final_data['pro'])}명의 프로 영상 수집됨.")

if __name__ == "__main__":
    main()
