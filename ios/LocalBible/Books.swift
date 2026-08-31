import Foundation

struct BookInfo {
    let id: Int
    let shortName: String
    let longName: String
    let chapterCount: Int
}

enum Books {
    static let all: [BookInfo] = [
        .init(id: 1, shortName: "创", longName: "创世记", chapterCount: 50),
        .init(id: 2, shortName: "出", longName: "出埃及记", chapterCount: 40),
        .init(id: 3, shortName: "利", longName: "利未记", chapterCount: 27),
        .init(id: 4, shortName: "民", longName: "民数记", chapterCount: 36),
        .init(id: 5, shortName: "申", longName: "申命记", chapterCount: 34),
        .init(id: 6, shortName: "书", longName: "约书亚记", chapterCount: 24),
        .init(id: 7, shortName: "士", longName: "士师记", chapterCount: 21),
        .init(id: 8, shortName: "得", longName: "路得记", chapterCount: 4),
        .init(id: 9, shortName: "撒上", longName: "撒母耳记上", chapterCount: 31),
        .init(id: 10, shortName: "撒下", longName: "撒母耳记下", chapterCount: 24),
        .init(id: 11, shortName: "王上", longName: "列王纪上", chapterCount: 22),
        .init(id: 12, shortName: "王下", longName: "列王纪下", chapterCount: 25),
        .init(id: 13, shortName: "代上", longName: "历代志上", chapterCount: 29),
        .init(id: 14, shortName: "代下", longName: "历代志下", chapterCount: 36),
        .init(id: 15, shortName: "拉", longName: "以斯拉记", chapterCount: 10),
        .init(id: 16, shortName: "尼", longName: "尼希米记", chapterCount: 13),
        .init(id: 17, shortName: "斯", longName: "以斯帖记", chapterCount: 10),
        .init(id: 18, shortName: "伯", longName: "约伯记", chapterCount: 42),
        .init(id: 19, shortName: "诗", longName: "诗篇", chapterCount: 150),
        .init(id: 20, shortName: "箴", longName: "箴言", chapterCount: 31),
        .init(id: 21, shortName: "传", longName: "传道书", chapterCount: 12),
        .init(id: 22, shortName: "歌", longName: "雅歌", chapterCount: 8),
        .init(id: 23, shortName: "赛", longName: "以赛亚书", chapterCount: 66),
        .init(id: 24, shortName: "耶", longName: "耶利米书", chapterCount: 52),
        .init(id: 25, shortName: "哀", longName: "耶利米哀歌", chapterCount: 5),
        .init(id: 26, shortName: "结", longName: "以西结书", chapterCount: 48),
        .init(id: 27, shortName: "但", longName: "但以理书", chapterCount: 12),
        .init(id: 28, shortName: "何", longName: "何西阿书", chapterCount: 14),
        .init(id: 29, shortName: "珥", longName: "约珥书", chapterCount: 3),
        .init(id: 30, shortName: "摩", longName: "阿摩司书", chapterCount: 9),
        .init(id: 31, shortName: "俄", longName: "俄巴底亚书", chapterCount: 1),
        .init(id: 32, shortName: "拿", longName: "约拿书", chapterCount: 4),
        .init(id: 33, shortName: "弥", longName: "弥迦书", chapterCount: 7),
        .init(id: 34, shortName: "鸿", longName: "那鸿书", chapterCount: 3),
        .init(id: 35, shortName: "哈", longName: "哈巴谷书", chapterCount: 3),
        .init(id: 36, shortName: "番", longName: "西番雅书", chapterCount: 3),
        .init(id: 37, shortName: "该", longName: "哈该书", chapterCount: 2),
        .init(id: 38, shortName: "亚", longName: "撒迦利亚书", chapterCount: 14),
        .init(id: 39, shortName: "玛", longName: "玛拉基书", chapterCount: 4),
        .init(id: 40, shortName: "太", longName: "马太福音", chapterCount: 28),
        .init(id: 41, shortName: "可", longName: "马可福音", chapterCount: 16),
        .init(id: 42, shortName: "路", longName: "路加福音", chapterCount: 24),
        .init(id: 43, shortName: "约", longName: "约翰福音", chapterCount: 21),
        .init(id: 44, shortName: "徒", longName: "使徒行传", chapterCount: 28),
        .init(id: 45, shortName: "罗", longName: "罗马书", chapterCount: 16),
        .init(id: 46, shortName: "林前", longName: "哥林多前书", chapterCount: 16),
        .init(id: 47, shortName: "林后", longName: "哥林多后书", chapterCount: 13),
        .init(id: 48, shortName: "加", longName: "加拉太书", chapterCount: 6),
        .init(id: 49, shortName: "弗", longName: "以弗所书", chapterCount: 6),
        .init(id: 50, shortName: "腓", longName: "腓立比书", chapterCount: 4),
        .init(id: 51, shortName: "西", longName: "歌罗西书", chapterCount: 4),
        .init(id: 52, shortName: "帖前", longName: "帖撒罗尼迦前书", chapterCount: 5),
        .init(id: 53, shortName: "帖后", longName: "帖撒罗尼迦后书", chapterCount: 3),
        .init(id: 54, shortName: "提前", longName: "提摩太前书", chapterCount: 6),
        .init(id: 55, shortName: "提后", longName: "提摩太后书", chapterCount: 4),
        .init(id: 56, shortName: "多", longName: "提多书", chapterCount: 3),
        .init(id: 57, shortName: "门", longName: "腓利门书", chapterCount: 1),
        .init(id: 58, shortName: "来", longName: "希伯来书", chapterCount: 13),
        .init(id: 59, shortName: "雅", longName: "雅各书", chapterCount: 5),
        .init(id: 60, shortName: "彼前", longName: "彼得前书", chapterCount: 5),
        .init(id: 61, shortName: "彼后", longName: "彼得后书", chapterCount: 3),
        .init(id: 62, shortName: "约一", longName: "约翰一书", chapterCount: 5),
        .init(id: 63, shortName: "约二", longName: "约翰二书", chapterCount: 1),
        .init(id: 64, shortName: "约三", longName: "约翰三书", chapterCount: 1),
        .init(id: 65, shortName: "犹", longName: "犹大书", chapterCount: 1),
        .init(id: 66, shortName: "启", longName: "启示录", chapterCount: 22),
    ]

    static func name(_ id: Int) -> String {
        all.first(where: { $0.id == id })?.longName ?? "第 \(id) 卷"
    }

    static var totalChapters: Int {
        all.reduce(0) { $0 + $1.chapterCount }
    }

    static func json() -> [[String: Any]] {
        all.map {
            [
                "id": $0.id,
                "shortName": $0.shortName,
                "longName": $0.longName,
                "chapterCount": $0.chapterCount,
            ]
        }
    }
}
