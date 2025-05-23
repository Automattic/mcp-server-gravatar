import { ExperimentalApi } from '../generated/gravatar-api/apis/ExperimentalApi.js';
import { createRestApiConfig } from '../config/server-config.js';

/**
 * Fetch interests by identifier using ExperimentalApi
 */
export async function fetchInterestsById(profileIdentifier: string) {
  const config = createRestApiConfig();
  const experimentalApi = new ExperimentalApi(config);
  const interests = await experimentalApi.getProfileInferredInterestsById({
    profileIdentifier,
  });

  // Extract just the name field from each interest
  const interestNames = interests.map((interest: { name: string }) => interest.name);
  return {
    content: [{ type: 'text', text: JSON.stringify(interestNames, null, 2) }],
  };
}
