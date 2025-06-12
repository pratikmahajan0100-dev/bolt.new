Example Prompt for V0:

Can you help me build a simple UI to interface with an API I have? The app should do the following:

give the user a way to send in files, and send those files to an api endpoint as a POST request, to "http://localhost:8000/receive_files/". The input data should be called "filenames" and should be a list of List[UploadFile] objects as used by FastAPI. The other input should be called "object_names", and be the string "raw_files".

Run the following API functions in the same location once the files are input:  extract_text_from_files(object_name='raw_files', new_object_name='extracted_text'), extract_details_from_text(object_name='extracted_text', new_object_name='contact_info', extract_elements=['name', 'organization', 'phone number', 'email'])

Every 15 seconds, try to POST a variable called object_name='contact_info' to the endpoint http://localhost:8000/return_data/. Once a 200 result is gotten from the endpoint, show the value of the returned object to the user.
