import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const BASIC_AUTH = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SEARCH_ENDPOINT = 'https://api.spotify.com/v1/search';

async function getAccessToken() {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('Spotify credentials missing');
    }

    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${BASIC_AUTH}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Spotify token');
    }

    const data = await response.json();
    return data.access_token;
}

export async function POST(req: Request) {
    try {
        const { query, type = 'track' } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query required' }, { status: 400 });
        }

        const token = await getAccessToken();

        const params = new URLSearchParams({
            q: query,
            type: type, // 'track' or 'playlist'
            limit: '1',
        });

        const searchRes = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!searchRes.ok) {
            throw new Error('Spotify search failed');
        }

        const searchData = await searchRes.json();

        let result = null;
        if (type === 'track' && searchData.tracks.items.length > 0) {
            result = searchData.tracks.items[0];
        } else if (type === 'playlist' && searchData.playlists.items.length > 0) {
            result = searchData.playlists.items[0];
        }

        if (!result) {
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({
            found: true,
            id: result.id,
            uri: result.uri,
            name: result.name,
            artist: result.artists ? result.artists[0].name : result.owner.display_name
        });

    } catch (error) {
        console.error('Spotify API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
