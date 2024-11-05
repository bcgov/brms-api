import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { GithubAuthService } from './github-auth.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GithubAuthService', () => {
  let service: GithubAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GithubAuthService, Logger],
    }).compile();

    service = module.get<GithubAuthService>(GithubAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGitHubAuthURL', () => {
    it('should generate the correct GitHub OAuth URL', () => {
      const returnUrl = 'http://localhost:3000/home';
      const url = service.getGitHubAuthURL(returnUrl);
      expect(url).toContain(`state=${encodeURIComponent(returnUrl)}`);
      expect(url).toContain('scope=repo,read:user');
    });
  });

  describe('getAccessToken', () => {
    it('should return an access token', async () => {
      const mockAccessToken = 'access_token_123';
      mockedAxios.post.mockResolvedValue({ data: { access_token: mockAccessToken } });

      const code = 'code123';
      const accessToken = await service.getAccessToken(code);

      expect(accessToken).toEqual(mockAccessToken);
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe('getGithubUser', () => {
    it('should return GitHub user info', async () => {
      const mockGithubUser = { login: 'user123' };
      mockedAxios.get.mockResolvedValue({ data: mockGithubUser });

      const accessToken = 'access_token_123';
      const githubUser = await service.getGithubUser(accessToken);

      expect(githubUser).toEqual(mockGithubUser);
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });
});
