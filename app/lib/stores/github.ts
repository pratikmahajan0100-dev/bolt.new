import { atom, type WritableAtom } from 'nanostores';
import { workbenchStore } from './workbench';

export interface GitHubConfig {
  token?: string;
  username?: string;
  repoName?: string;
}

class GitHubStore {
  config: WritableAtom<GitHubConfig> = atom({});

  async pushToGitHub(token: string, username: string, repoName: string): Promise<void> {
    try {
      // First, create the repository if it doesn't exist
      const createRepoResponse = await fetch(`https://api.github.com/user/repos`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          private: false,
          auto_init: false,
        }),
      });

      if (!createRepoResponse.ok && createRepoResponse.status !== 422) { // 422 means repo already exists
        throw new Error(`Failed to create repository: ${createRepoResponse.statusText}`);
      }

      // Get all files from workbench
      const files = workbenchStore.files.get();
      
      // Create a commit with all files
      for (const [filePath, dirent] of Object.entries(files)) {
        if (dirent?.type === 'file' && !dirent.isBinary) {
          const relativePath = filePath.replace(/^\/home\/project\//, '');
          
          // Create/update file in repository
          const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${relativePath}`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Add/Update ${relativePath}`,
              content: btoa(dirent.content), // Base64 encode content
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to push file ${relativePath}: ${response.statusText}`);
          }
        }
      }

      // Update config store
      this.config.set({ token, username, repoName });
      
    } catch (error) {
      console.error('Error pushing to GitHub:', error);
      throw error;
    }
  }
}

export const githubStore = new GitHubStore(); 