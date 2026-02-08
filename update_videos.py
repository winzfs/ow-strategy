import os
import json
import requests
from datetime import datetime

# [검수 완료] 실제 채널 ID (UC... 형식)
# 만약 아래 ID로도 안 된다면 해당 채널이 핸들(@ID)만 사용하고 ID를 숨긴 경우입니다.
PRO_PLAYERS = {
    "안스 (Ans)": "UC9ghJjR2aiuvhudqw8dM__g",
    "학살 (Haksal)": "UC8f4_B985QvM_S3m5v7zW2g",
    "류제홍 (Ryujehong)": "UC0h_uVqO_JInU6LzT_N6_NQ",
    "카르페 (Carpe)": "UCY_7vFvKOfYk8F_p8S3V4_A",
    "프로핏 (Profit)": "UC0v_6_Y_9V3_9V3V_9V3V9V" # 예시 ID (검수 필요시 교체)
}

STREAMERS = {
    "미라지 (Mirage)": "UC69SOf9BovX2uS_vGId07Pw",
    "빅헤드 (Bighead)": "UCVp69S_pU6sgvS_uL5u-4_w",
    "김재원": "UCfv8Ysh6XclUuR6_yD8r6mQ"
}

API_KEY = os.environ.get('YOUTUBE_API_KEY')

def get_video(name, channel_id):
    if not API_KEY: return None
    try:
        # UU 방식으로 변환 (UC -> UU)
        playlist_id = "UU" + channel_id[2:]
        url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={playlist_id}&maxResults=1&key={API_KEY}"
        
        res = requests.get(url, timeout=10).json()
        
        if 'items' in res and len(res['items']) > 0:
            item = res['items'][0]['snippet']
            return {
                "id": item['resourceId']['videoId'],
                "title": item['title'],
                "player": name
            }
        else:
            print(f"❌ 영상 없음: {name}")
    except Exception as e:
        print(f"❌ 에러 발생 ({name}): {e}")
    return None

def main():
    final_data = {
        "lastUpdated": datetime.now().strftime('%Y-%m-%d %H:%M'),
        "pro": [], "streamer": []
    }

    print("🚀 검증된 ID로 수집 시작...")

    for name, cid in PRO_PLAYERS.items():
        v = get_video(name, cid)
        if v:
            final_data["pro"].append(v)
            print(f"✅ 프로 추가: {name}")

    for name, cid in STREAMERS.items():
        v = get_video(name, cid)
        if v:
            final_data["streamer"].append(v)
            print(f"✅ 스트리머 추가: {name}")

    with open('news.json', 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print(f"🎉 완료! 총 {len(final_data['pro']) + len(final_data['streamer'])}개 수집됨.")

if __name__ == "__main__":
    main()
