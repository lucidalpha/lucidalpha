from youtube_transcript_api import YouTubeTranscriptApi

video_id = "0dhp6Do3-qg"

try:
    # Use list_transcripts first to find available ones
    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
    
    # Try to fetch English or German or auto-generated
    transcript = transcript_list.find_generated_transcript(['en', 'de'])
    
    data = transcript.fetch()
    
    full_text = " ".join([entry['text'] for entry in data])
    
    with open("video_transcript.txt", "w", encoding="utf-8") as f:
        f.write(full_text)
        
    print("Transcript extracted successfully.")
except Exception as e:
    print(f"Error getting transcript: {e}")
