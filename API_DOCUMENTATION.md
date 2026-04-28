# Blog API Documentation

This document describes the Article API schema and structure for frontend integration.

## Base URL

```
https://your-strapi-instance.com/api
```

## Article Schema

### Article Content Type

**Endpoint**: `/api/articles`

**Fields**:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | number | Unique identifier | Yes (auto) |
| `documentId` | string | Document ID | Yes (auto) |
| `title` | string | Article title | Yes |
| `description` | text | Short description (max 80 chars) | No |
| `slug` | uid | URL-friendly identifier | Yes (auto) |
| `cover` | media | Cover image | No |
| `thumbnail` | media | Thumbnail image | No |
| `author` | relation | Author relation | No |
| `category` | relation | Category relation | No |
| `blocks` | dynamiczone | Content blocks (rich text, media, etc.) | No |
| `seo` | component | SEO metadata (metaTitle, metaDescription, shareImage) | No |
| `publishedAt` | datetime | Publication date | Yes |
| `createdAt` | datetime | Creation date | Yes (auto) |
| `updatedAt` | datetime | Last update date | Yes (auto) |

### Related Content Types

#### Author

**Fields**:
- `id` (number)
- `name` (string)
- `email` (string)
- `avatar` (media - image)
- `articles` (relation - oneToMany)

#### Category

**Fields**:
- `id` (number)
- `name` (string)
- `slug` (string)
- `description` (text)
- `articles` (relation - oneToMany)

### Content Blocks (Dynamic Zone)

Articles can contain multiple block types in the `blocks` field:

#### 1. Rich Text (`shared.rich-text`)
```json
{
  "__component": "shared.rich-text",
  "id": 123,
  "body": "Markdown or rich text content"
}
```

#### 2. Quote (`shared.quote`)
```json
{
  "__component": "shared.quote",
  "id": 124,
  "title": "Quote title",
  "body": "Quote text"
}
```

#### 3. Media (`shared.media`)
```json
{
  "__component": "shared.media",
  "id": 125,
  "file": {
    "id": 10,
    "url": "https://...",
    "alternativeText": "Alt text",
    "width": 1920,
    "height": 1080,
    "mime": "image/jpeg",
    "size": 250.5
  }
}
```

#### 4. Slider (`shared.slider`)
```json
{
  "__component": "shared.slider",
  "id": 126,
  "files": [
    {
      "id": 11,
      "url": "https://...",
      "alternativeText": "Image 1",
      "width": 1920,
      "height": 1080
    },
    // ... more images
  ]
}
```

#### 5. Video Embed (`shared.video-embed`)

Editors can paste **any** YouTube or Vimeo URL in the admin (share link, watch URL,
`youtu.be`, shorts, embed, `player.vimeo.com`, etc.). The API auto-detects the
provider and exposes a ready-to-use `embedUrl` plus `provider` / `videoId` so the
frontend can render an iframe (or a custom player) without doing any URL parsing.

```json
{
  "__component": "shared.video-embed",
  "id": 127,
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "Video title",
  "provider": "youtube",
  "videoId": "dQw4w9WgXcQ",
  "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ"
}
```

| Field      | Type                              | Description                                                       |
|------------|-----------------------------------|-------------------------------------------------------------------|
| `url`      | string                            | The original URL the editor pasted.                               |
| `title`    | string \| null                    | Optional title.                                                   |
| `provider` | `"youtube"` \| `"vimeo"` \| null  | Detected provider (null if URL is unrecognized).                  |
| `videoId`  | string \| null                    | Extracted video id (e.g. `dQw4w9WgXcQ` or `123456789`).           |
| `embedUrl` | string \| null                    | iframe-safe URL (`youtube.com/embed/…` or `player.vimeo.com/video/…`). |

**Frontend example (React):**

```jsx
function VideoEmbed({ block }) {
  if (!block.embedUrl) return null;
  return (
    <div style={{ position: 'relative', paddingTop: '56.25%' }}>
      <iframe
        src={block.embedUrl}
        title={block.title || 'Embedded video'}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
```

> Note: `provider`, `videoId`, and `embedUrl` are computed at response time by the
> article controller — they are not stored in the database. Only `url` and `title`
> need to be sent on writes.

#### SEO Component (`shared.seo`)
```json
{
  "metaTitle": "Article Title for Social Media",
  "metaDescription": "Article description for search engines and social media",
  "shareImage": {
    "id": 10,
    "url": "https://...",
    "alternativeText": "Alt text",
    "width": 1200,
    "height": 630
  }
}
```

## Media Object Structure

Media fields (cover, thumbnail, avatar, file) return:

```typescript
{
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: {
    thumbnail?: { url: string; width: number; height: number; size: number; };
    small?: { url: string; width: number; height: number; size: number; };
    medium?: { url: string; width: number; height: number; size: number; };
    large?: { url: string; width: number; height: number; size: number; };
  };
  hash: string;
  ext: string;
  mime: string;
  size: number; // in KB
  url: string;
  previewUrl: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}
```

## API Endpoints

### Get All Articles (List View)

**GET** `/api/articles`

**Query Parameters**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `populate` | string/object | Fields to populate | `populate=*` or `populate[cover]=*` |
| `sort` | string | Sort order | `publishedAt:desc` |
| `pagination[page]` | number | Page number | `1` |
| `pagination[pageSize]` | number | Items per page | `9` |
| `publicationState` | string | `live` or `preview` | `live` |
| `filters` | object | Filter conditions | `filters[slug][$eq]=article-slug` |

**Example Request**:
```javascript
GET /api/articles?populate=*&populate[cover][populate]=*&populate[blocks][populate]=*&sort=publishedAt:desc&pagination[pageSize]=9&publicationState=preview
```

**Recommended for Blog Cards** (Optimized):
```javascript
GET /api/articles?
  populate[category][fields][0]=name&
  populate[category][fields][1]=slug&
  populate[author][fields][0]=name&
  populate[author][populate][avatar][fields][0]=url&
  populate[author][populate][avatar][fields][1]=alternativeText&
  populate[cover][fields][0]=url&
  populate[cover][fields][1]=alternativeText&
  populate[cover][fields][2]=width&
  populate[cover][fields][3]=height&
  sort=publishedAt:desc&
  pagination[pageSize]=9&
  publicationState=preview
```

**Response**:
```json
{
  "data": [
    {
      "id": 36,
      "documentId": "lnuie0n5dg31vqwqf3utot3f",
      "title": "Article Title",
      "description": "Article description",
      "slug": "article-slug",
      "publishedAt": "2025-11-02T20:26:54.828Z",
      "cover": { /* media object */ },
      "thumbnail": null,
      "category": {
        "id": 3,
        "name": "Category Name",
        "slug": "category-slug"
      },
      "author": {
        "id": 3,
        "name": "Author Name",
        "email": "author@example.com",
        "avatar": { /* media object */ }
      },
      "blocks": [ /* array of block components */ ]
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 9,
      "pageCount": 1,
      "total": 2
    }
  }
}
```

### Get Single Article (Detail View)

**GET** `/api/articles/:id` or `/api/articles?filters[slug][$eq]=article-slug`

**Example Request**:
```javascript
GET /api/articles?filters[slug][$eq]=article-slug&populate=*&populate[cover][populate]=*&populate[blocks][populate]=*
```

**Response**: Same structure as list item, but single object in `data` array.

## TypeScript Types

If your frontend uses TypeScript, you can use the generated types from:
```
types/generated/contentTypes.d.ts
```

Example:
```typescript
import type { ApiArticleArticle } from './types/generated/contentTypes';

type Article = ApiArticleArticle['attributes'];
```

## Performance Recommendations

### For Blog List/Cards View
- ✅ DO populate: `category`, `author`, `cover`
- ❌ DON'T populate `blocks` (huge performance hit - 50-200KB per article)
- ✅ Limit fields to only what's needed for cards
- ✅ Use pagination (default: 10 items)

### For Article Detail View
- ✅ DO populate: `blocks` (needed for full content)
- ✅ DO populate: `cover`, `author`, `category`
- ⚠️ Be aware: Blocks can be large with many images

### Image Optimization
- Use `formats` field to get optimized sizes:
  - `formats.thumbnail` - Small (245px)
  - `formats.small` - Medium (500px)
  - `formats.medium` - Large (750px)
  - `formats.large` - Extra Large (1000px)

## Example Queries

### Minimal Query (Fastest)
```javascript
GET /api/articles?pagination[pageSize]=9&sort=publishedAt:desc
```

### Blog Cards (Optimized)
```javascript
GET /api/articles?
  populate[category]=fields=name,slug&
  populate[author]=fields=name&
  populate[author][populate][avatar]=fields=url,alternativeText&
  populate[cover]=fields=url,alternativeText,width,height&
  sort=publishedAt:desc&
  pagination[pageSize]=9
```

### Full Article with Blocks
```javascript
GET /api/articles?filters[slug][$eq]=article-slug&populate=*&populate[blocks][populate]=*
```

## Error Responses

### 404 Not Found
```json
{
  "error": {
    "status": 404,
    "message": "Not Found"
  }
}
```

### 400 Bad Request
```json
{
  "error": {
    "status": 400,
    "message": "Invalid query parameters"
  }
}
```

## Notes

- All dates are in ISO 8601 format (UTC)
- Media URLs are absolute URLs
- `populate=*` loads ALL relationships (use with caution - can be slow)
- Use `publicationState=preview` for draft content, `live` for published
- Pagination defaults: page=1, pageSize=25 (but can be overridden)

