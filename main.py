import streamlit as st
import requests
import io
from PIL import Image

API_BASE = "http://localhost:8787"

def send_message(message):
    API_URL = API_BASE + "/chat"
    response = requests.post(API_URL, json=message)
    return response.json()["response"]

def generate_image(prompt):
    API_URL = API_BASE + "/image"
    response = requests.post(API_URL, json={ "prompt": prompt })
    return response.content

st.title("💬 Chatbot and Image generation - Chat & Text to Image")
st.caption("🚀 A Streamlit chatbot powered by CloudFlare Workers AI")

with st.sidebar:
    st.title("Image generation")
    
    image_prompt = st.text_input("Prompt:")
    
    if image_prompt:
        with st.spinner('Wait for it...'):
            image_bytes = generate_image(image_prompt)
        
            image = Image.open(io.BytesIO(image_bytes))
            
            st.image(image, caption=image_prompt, use_column_width=True)

if "messages" not in st.session_state:
    st.session_state["messages"] = []

if prompt := st.chat_input():
    st.session_state.messages.append({"role": "user", "content": prompt})
    st.chat_message("user").write(prompt)
    
    msg = send_message({
        "messages": st.session_state.messages
    })

    st.session_state.messages.append({"role": "assistant", "content": msg })
    st.chat_message("assistant").write(msg)