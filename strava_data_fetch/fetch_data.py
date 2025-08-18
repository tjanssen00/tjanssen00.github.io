import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

auth_url = "https://www.strava.com/oauth/token"
activites_url = "https://www.strava.com/api/v3/athlete/activities"

payload = {
    'client_id': "135275",
    'client_secret': 'aa62c5630919d7c57ee1dd264d8bfa4b44010425',
    'refresh_token': 'e18b892ea5b1a1e118947f860efdaafbe64ef775',
    'grant_type': "refresh_token",
    'f': 'json'
}

print("Requesting Token...\n")
res = requests.post(auth_url, data=payload, verify=False)
access_token = res.json()['access_token']

print("Access Token = {}\n".format(access_token))
header = {'Authorization': 'Bearer ' + access_token}

# The first loop, request_page_number will be set to one, so it requests the first page. Increment this number after
# each request, so the next time we request the second page, then third, and so on...
request_page_num = 1
all_activities = []

while True:
    param = {'per_page': 200, 'page': request_page_num}
    # initial request, where we request the first page of activities
    my_dataset = requests.get(activites_url, headers=header, params=param).json()

    # check the response to make sure it is not empty. If it is empty, that means there is no more data left. So if you have
    # 1000 activities, on the 6th request, where we request page 6, there would be no more data left, so we will break out of the loop
    if len(my_dataset) == 0:
        print("breaking out of while loop because the response is zero, which means there must be no more activities")
        break

    # if the all_activities list is already populated, that means we want to add additional data to it via extend.
    if all_activities:
        print("all_activities is populated")
        all_activities.extend(my_dataset)

    # if the all_activities is empty, this is the first time adding data so we just set it equal to my_dataset
    else:
        print("all_activities is NOT populated")
        all_activities = my_dataset

    request_page_num += 1

import json

# Save to file
with open("activities.json", "w", encoding="utf-8") as f:
    json.dump(all_activities, f, ensure_ascii=False, indent=2)

print(len(all_activities))
for count, activity in enumerate(all_activities):
    print(activity["name"])
    print(count)