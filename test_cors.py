import requests

try:
    response = requests.post('http://localhost:8000/signup', json={'username': 'testuser456', 'password': 'testpass'})
    print('Status:', response.status_code)
    print('Response:', response.text)
    print('CORS headers:', response.headers.get('access-control-allow-origin', 'None'))
except Exception as e:
    print('Error:', e)