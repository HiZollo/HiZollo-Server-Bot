# Music Adapter
Music Adapter 是一個符合 `Adapter` 介面的物件，用於在 `GuildMusicManager` 中處理來自不同音樂來源的音樂資料。只要某個物件實現了這個介面，它就能被 `GuildMusicManager` 使用，來處理特定音樂平台或來源的音樂。

## 介面規範
### `Adapter` 介面
`Adapter` 介面定義了所有 Music Adapter 必須實現的方法，這些方法涵蓋了如何識別、提取和處理音樂來源的資料。
```ts
interface Adapter {
    /**
     * 檢查該 Adapter 是否能處理給定的 URL。
     * 在 `GuildMusicManager` 中，`supports` 用於逐一檢查每個 URL，並選擇第一個能處理的 Adapter。
     * @param url 音樂來源的 URL。
     * @returns 如果該 Adapter 能夠處理此 URL，則返回 true，否則返回 false。
     */
    supports(url: string): boolean;

    /**
     * 檢查該 URL 是否指向一個音樂列表。
     * 如果 URL 指向的是一個包含多首音軌的列表，則返回 true。
     * @param url 音樂來源的 URL。
     * @returns 如果該 URL 指向一個音樂列表，則返回 true，否則返回 false。
     */
    isList(url: string): boolean;

    /**
     * 根據 URL 獲取單個音軌的詳細資料。
     * @param url 音樂來源的 URL。
     * @returns 返回一個包含音軌詳細資訊的 Promise。
     */
    getTrackInfo(url: string): Promise<{ inputURL: string, metadata: TrackInfo }>;

    /**
     * 批量獲取音樂列表中的所有音軌的詳細資料。
     * @param url 音樂來源的 URL。
     * @returns 返回一個包含所有音軌資訊的 Promise 陣列。
     */
    getBulkTrackInfo(url: string): Promise<{ inputURL: string, metadata: TrackInfo }[]>;

    /**
     * 獲取音樂的實際播放 URL。
     * @param url 音樂來源的 URL。
     * @returns 返回音樂的播放 URL。
     */
    getResourceURL(url: string): Promise<string>;
}
```

### `SearchableAdapter` 介面
並非所有音樂來源都支援搜尋功能，所以 `SearchableAdapter` 介面是為了那些能夠提供搜尋功能的音樂來源而設計的。當某個 Adapter 類型支援搜尋功能時，可以選擇實現 `SearchableAdapter` 介面，這樣 `GuildMusicManager` 就可以透過統一的 `search` 方法來執行搜尋。

```ts
interface SearchableAdapter extends Adapter {
    /**
     * 根據查詢關鍵字搜尋音樂。
     * @param query 搜索的關鍵字。
     * @returns 返回符合條件的音樂標題和 URL 的陣列。
     */
    search(query: string): Promise<{ title: string, url: string }[]>;
}
```

### `TrackInfo` 類型
`TrackInfo` 用來描述音軌的基本資訊，定義如下：

```ts
interface TrackInfo {
    /**
     * 音軌的標題。
     */
    title: string;

    /**
     * 音軌的 URL。
     */
    url: string;

    /**
     * 音軌的縮略圖 URL（可選）。
     */
    thumbnail?: string;

    /**
     * 音軌的長度（單位：秒， 可選）。
     */
    lengthSeconds?: number;

    /**
     * 音軌的觀看次數（可選）。
     */
    viewCount?: number;

    /**
     * 音軌的上傳日期（可選）。
     */
    uploadDate?: Date;

    /**
     * 音軌的作者資訊（可選）。
     */
    author?: {
        /**
         * 作者的名稱。
         */
        name: string;

        /**
         * 作者的 URL（可選）。
         */
        url?: string;
    };
}
```

## `GuildMusicManager` 與 `Adapter` 的關係
在 `GuildMusicManager` 中，`supports` 方法被用來逐一檢查某個音樂來源的 URL 是否適用於特定的 Adapter。`GuildMusicManager` 會依序檢查所有已註冊的 Adapter，直到找到第一個返回 `true` 的 Adapter，並使用該 Adapter 處理音樂。

再來，`GuildMusicManager` 會使用 `isList` 方法來檢查音樂是否為列表。如果是，則 `GuildMusicManager` 會使用 `getBulkTrackInfo` 方法來獲取所有音軌的詳細資訊，否則使用 `getTrackInfo` 方法來獲取單個音軌的詳細資訊。

最後，`GuildMusicManager` 會使用 `getResourceURL` 方法來獲取音樂的實際播放 URL，並將其傳遞給音樂播放器進行播放。

