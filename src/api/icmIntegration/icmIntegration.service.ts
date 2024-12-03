import axios from 'axios';
import { Injectable } from '@nestjs/common';

const BASE_URL = 'https://sieblabp.apps.gov.bc.ca/fw/v1.0/data';
const TOKEN_URL = 'https://dev.loginproxy.gov.bc.ca/auth/realms/social/protocol/openid-connect/token';
const CLIENT_ID = 'sieblab.op';

@Injectable()
export class ICMIntegrationService {
  async refreshToken(refreshToken) {
    const payload = new URLSearchParams();
    payload.append('grant_type', 'refresh_token');
    payload.append('client_id', CLIENT_ID);
    payload.append('client_secret', '');
    payload.append('refresh_token', refreshToken);

    try {
      const tokensData = await axios.post(TOKEN_URL, payload);
      const tokens = tokensData.data;
      const newIdentityToken = tokens.id_token;
      const newAccessToken = tokens.access_token;
      const newRefreshToken = tokens.refresh_token;
      console.log('New Identity Token:', newIdentityToken);
      console.log('New Access Token:', newAccessToken);
      console.log('New Refresh Token:', newRefreshToken);
      return tokens;
    } catch (error) {
      console.error('Failed to refresh tokens:', error.response.status, error.response.data);
    }
  }

  async callAPI(urlEnd, identityToken) {
    console.log('Calling: ', urlEnd);
    const { data } = await axios.get(`${BASE_URL}/${urlEnd}`, {
      headers: {
        Authorization: `Bearer ${identityToken}`,
      },
    });
    const result = data.items ? data.items : data;
    console.log('Result: ', result);
    return result;
  }
}
