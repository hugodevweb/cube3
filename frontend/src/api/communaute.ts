import apiClient from './axios';

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Like {
  userId: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  comments: Comment[];
  likes: Like[];
  createdAt: string;
  updatedAt: string;
}

export const communauteApi = {
  getPosts: () =>
    apiClient.get<Post[]>('/communaute/posts').then((r) => r.data),

  getPost: (id: string) =>
    apiClient.get<Post>(`/communaute/posts/${id}`).then((r) => r.data),

  createPost: (data: { title: string; content: string }) =>
    apiClient.post<Post>('/communaute/posts', data).then((r) => r.data),

  updatePost: (id: string, data: { title?: string; content?: string }) =>
    apiClient.put<Post>(`/communaute/posts/${id}`, data).then((r) => r.data),

  deletePost: (id: string) =>
    apiClient.delete(`/communaute/posts/${id}`),

  addComment: (postId: string, content: string) =>
    apiClient.post<Comment>(`/communaute/posts/${postId}/comments`, { content }).then((r) => r.data),

  toggleLike: (postId: string) =>
    apiClient.post<{ liked: boolean }>(`/communaute/posts/${postId}/like`).then((r) => r.data),
};
