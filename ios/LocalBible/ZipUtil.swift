import Foundation
import zlib

enum ZipUtil {
    enum ZipError: LocalizedError {
        case truncated
        case unsupported
        case inflate

        var errorDescription: String? {
            switch self {
            case .truncated: return "资源包不完整"
            case .unsupported: return "资源包压缩格式不支持"
            case .inflate: return "资源包解压失败"
            }
        }
    }

    static func extractDbFiles(from zipURL: URL, to dest: URL) throws -> Int {
        try FileManager.default.createDirectory(at: dest, withIntermediateDirectories: true)
        let handle = try FileHandle(forReadingFrom: zipURL)
        defer { try? handle.close() }
        var installed = 0
        while let header = try readLocalHeader(handle) {
            if header.directory || !header.name.lowercased().hasSuffix(".db") {
                try skip(handle, header.compressedSize)
                continue
            }
            let name = safeName(header.name)
            if name.isEmpty {
                try skip(handle, header.compressedSize)
                continue
            }
            let target = dest.appendingPathComponent(name)
            try writeEntry(handle: handle, header: header, to: target)
            installed += 1
        }
        return installed
    }

    private struct Header {
        let name: String
        let method: UInt16
        let compressedSize: Int
        let directory: Bool
    }

    private static func readLocalHeader(_ handle: FileHandle) throws -> Header? {
        let sigData = try handle.read(upToCount: 4) ?? Data()
        if sigData.count < 4 { return nil }
        let sig = u32(sigData)
        if sig != 0x04034b50 { return nil }
        _ = try u16(handle)
        let flags = try u16(handle)
        let method = try u16(handle)
        _ = try u16(handle)
        _ = try u16(handle)
        _ = try u32(handle)
        let compressed = Int(try u32(handle))
        _ = try u32(handle)
        let nameLen = Int(try u16(handle))
        let extraLen = Int(try u16(handle))
        let nameData = try handle.read(upToCount: nameLen) ?? Data()
        if nameData.count < nameLen { throw ZipError.truncated }
        if extraLen > 0 { try skip(handle, extraLen) }
        if flags & 1 != 0 { throw ZipError.unsupported }
        if flags & 8 != 0 { throw ZipError.unsupported }
        let name = decodeName(nameData)
        let directory = name.hasSuffix("/") || name.hasSuffix("\\")
        return Header(name: name, method: method, compressedSize: compressed, directory: directory)
    }

    private static func writeEntry(handle: FileHandle, header: Header, to dest: URL) throws {
        if header.method == 0 {
            let data = try handle.read(upToCount: header.compressedSize) ?? Data()
            if data.count < header.compressedSize { throw ZipError.truncated }
            try data.write(to: dest)
            return
        }
        if header.method != 8 { throw ZipError.unsupported }
        try inflateRaw(handle: handle, compressedSize: header.compressedSize, to: dest)
    }

    private static func inflateRaw(handle: FileHandle, compressedSize: Int, to dest: URL) throws {
        FileManager.default.createFile(atPath: dest.path, contents: nil)
        let out = try FileHandle(forWritingTo: dest)
        defer { try? out.close() }

        var stream = z_stream()
        let initOk = inflateInit2_(&stream, -MAX_WBITS, ZLIB_VERSION, Int32(MemoryLayout<z_stream>.size))
        guard initOk == Z_OK else { throw ZipError.inflate }
        defer { inflateEnd(&stream) }

        var remaining = compressedSize
        var inBuf = [UInt8](repeating: 0, count: 64 * 1024)
        var outBuf = [UInt8](repeating: 0, count: 64 * 1024)
        var failed: ZipError?

        inBuf.withUnsafeMutableBufferPointer { inPtr in
            outBuf.withUnsafeMutableBufferPointer { outPtr in
                while failed == nil {
                    if stream.avail_in == 0 && remaining > 0 {
                        let n = min(remaining, inPtr.count)
                        let chunk = (try? handle.read(upToCount: n)) ?? Data()
                        if chunk.isEmpty {
                            failed = .truncated
                            break
                        }
                        remaining -= chunk.count
                        chunk.copyBytes(to: inPtr.baseAddress!, count: chunk.count)
                        stream.avail_in = uInt(chunk.count)
                        stream.next_in = inPtr.baseAddress
                    }
                    stream.avail_out = uInt(outPtr.count)
                    stream.next_out = outPtr.baseAddress
                    let status = inflate(&stream, remaining > 0 ? Z_NO_FLUSH : Z_FINISH)
                    let produced = outPtr.count - Int(stream.avail_out)
                    if produced > 0 {
                        out.write(Data(bytes: outPtr.baseAddress!, count: produced))
                    }
                    if status == Z_STREAM_END { break }
                    if status != Z_OK {
                        failed = .inflate
                        break
                    }
                    if remaining == 0 && stream.avail_in == 0 && produced == 0 { break }
                }
            }
        }
        if let failed { throw failed }
        if remaining > 0 { try skip(handle, remaining) }
    }

    private static func decodeName(_ data: Data) -> String {
        if let utf8 = String(data: data, encoding: .utf8), !utf8.contains("\u{FFFD}") {
            return utf8
        }
        return String(data: data, encoding: .isoLatin1) ?? ""
    }

    private static func safeName(_ path: String) -> String {
        let name = (path as NSString).lastPathComponent
            .replacingOccurrences(of: "/", with: "")
            .replacingOccurrences(of: "\\", with: "")
        if name.isEmpty || name == "." || name == ".." || name.hasPrefix(".") { return "" }
        return name
    }

    private static func skip(_ handle: FileHandle, _ count: Int) throws {
        if count <= 0 { return }
        let pos = try handle.offset()
        try handle.seek(toOffset: pos + UInt64(count))
    }

    private static func u16(_ handle: FileHandle) throws -> UInt16 {
        let data = try handle.read(upToCount: 2) ?? Data()
        if data.count < 2 { throw ZipError.truncated }
        return UInt16(data[0]) | UInt16(data[1]) << 8
    }

    private static func u32(_ handle: FileHandle) throws -> UInt32 {
        let data = try handle.read(upToCount: 4) ?? Data()
        if data.count < 4 { throw ZipError.truncated }
        return u32(data)
    }

    private static func u32(_ data: Data) -> UInt32 {
        UInt32(data[0]) | UInt32(data[1]) << 8 | UInt32(data[2]) << 16 | UInt32(data[3]) << 24
    }
}
