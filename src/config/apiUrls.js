const localApiUrls = {
  capacityRequestAPIUrl: 'https://api01-np.agro.services/capacity-request-api',
  experimentsTaggingAPIUrl: 'https://experiments-tagging-api-d.velocity-np.ag/experiments-tagging-api',
  materialListsAPIUrl: 'https://api01-np.agro.services/material-lists-api/v1',
  pingUrl: 'https://test.amp.monsanto.com/as',
  preferencesAPIUrl: 'https://preferences.velocity-np.ag/v2',
  profileAPIUrl: 'https://profile.velocity-np.ag/v3',
  questionsV3APIUrl: 'https://api01-np.agro.services/questions-api/v3',
  randomizeTreatmentsAPIUrl: 'https://velocity-np.ag/randomize-treatments-api',
  setsAPIUrl: 'https://api01-np.agro.services/sets-api/v2',
  velocityMessagingAPIUrl: 'https://messaging.velocity-np.ag/v5',
  velocityUrl: 'https://dev.velocity-np.ag',
}
const apiUrls = process.env.EXTERNAL_API_URLS
  ? JSON.parse(process.env.EXTERNAL_API_URLS)
  : localApiUrls

export default apiUrls
