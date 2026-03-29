import requests

try:
    response = requests.post('http://localhost:8000/signup', json={'username': 'testuser123', 'password': 'testpass'})
    print('Status:', response.status_code)
    print('Response:', response.text)
    print('Headers:', dict(response.headers))
except Exception as e:
    print('Error:', e)