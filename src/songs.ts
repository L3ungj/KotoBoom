export interface Song {
    title: string;
    engTitle: string | null;
    artist: string;
    engArtist: string | null;
    url: string;
}

export const SONGS: Song[] = [
    {
        title: "こたえて",
        engTitle: "Answer Me",
        artist: "imie",
        engArtist: null,
        url: "https://piapro.jp/t/6W2N/20251215164617",
    },
    {
        title: "アフター・ザ・カーテン",
        engTitle: "After the Curtain",
        artist: "Rulmry",
        engArtist: null,
        url: "https://piapro.jp/t/zoqO/20251214200738",
    },
    {
        title: "シャッターチャンス",
        engTitle: "Shutter Chance",
        artist: "夜未アガリ",
        engArtist: "Yamiagari",
        url: "https://piapro.jp/t/PNpQ/20251209170719",
    },
    {
        title: "世界最後の音楽隊",
        engTitle: "The Last March on Earth",
        artist: "夏山よつぎ×ど～ぱみん",
        engArtist: "Natsuyama Yotsugi × Dopam!ne",
        url: "https://piapro.jp/t/B3yJ/20251215061727",
    },
    {
        title: "トリツクロジー",
        engTitle: "Toritsukulogy",
        artist: "鶴三",
        engArtist: "Tsuruzou",
        url: "https://piapro.jp/t/QBdL/20251215094303",
    },
    {
        title: "TAKEOVER",
        engTitle: null,
        artist: "Twinfield",
        engArtist: null,
        url: "https://piapro.jp/t/E2i3/20251215092113",
    }
]