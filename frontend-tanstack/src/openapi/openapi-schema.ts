export interface paths {
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["LoginRequest"];
                };
            };
            responses: {
                /** @description Success Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SuccessApiResponseBody_for_LoginResponse"];
                    };
                };
                /** @description Validation Error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorValidationApiResponseBody"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorApiResponseBody"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SuccessApiResponseBody_for_String"];
                    };
                };
                /** @description Validation Error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorValidationApiResponseBody"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorApiResponseBody"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/academic/logbook/upload_screenshot": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "multipart/form-data": components["schemas"]["UploadFileRequest"];
                };
            };
            responses: {
                /** @description Success Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SuccessApiResponseBody_for_Null"];
                    };
                };
                /** @description Validation Error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorValidationApiResponseBody"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorApiResponseBody"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/academic/logbook/upload_pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "multipart/form-data": components["schemas"]["UploadFileRequest"];
                };
            };
            responses: {
                /** @description Success Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SuccessApiResponseBody_for_Null"];
                    };
                };
                /** @description Validation Error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorValidationApiResponseBody"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorApiResponseBody"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/academic/logbook": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query: {
                    minggu: number;
                    semester: number;
                    tahun: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SuccessApiResponseBody_for_LogbookDetailResponse"];
                    };
                };
                /** @description Validation Error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorValidationApiResponseBody"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorApiResponseBody"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["LogbookCreateRequest"];
                };
            };
            responses: {
                /** @description Success Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SuccessApiResponseBody_for_String"];
                    };
                };
                /** @description Validation Error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorValidationApiResponseBody"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorApiResponseBody"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/academic/logbook/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["LogbookDeleteBodyRequest"];
                };
            };
            responses: {
                /** @description Success Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SuccessApiResponseBody_for_String"];
                    };
                };
                /** @description Validation Error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorValidationApiResponseBody"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorApiResponseBody"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/academic/absen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query: {
                    semester: number;
                    tahun: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SuccessApiResponseBody_for_AbsenResponse"];
                    };
                };
                /** @description Validation Error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorValidationApiResponseBody"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorApiResponseBody"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/academic/frs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query: {
                    semester: number;
                    tahun: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SuccessApiResponseBody_for_FrsResponse"];
                    };
                };
                /** @description Validation Error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorValidationApiResponseBody"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorApiResponseBody"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/academic/jadwal": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query: {
                    semester: number;
                    tahun: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SuccessApiResponseBody_for_JadwalKuliahResponse"];
                    };
                };
                /** @description Validation Error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorValidationApiResponseBody"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorApiResponseBody"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/academic/nilai": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query: {
                    semester: number;
                    tahun: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SuccessApiResponseBody_for_NilaiSemesterResponse"];
                    };
                };
                /** @description Validation Error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorValidationApiResponseBody"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorApiResponseBody"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/invalidate-cache": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SuccessApiResponseBody_for_String"];
                    };
                };
                /** @description Validation Error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorValidationApiResponseBody"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorApiResponseBody"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AbsenResponse: {
            semester: number[];
            table: components["schemas"]["AbsenTableResponse"][];
            year: number[];
        };
        AbsenTableResponse: {
            kehadiran: string;
            kode: string;
            mataKuliah: string;
            minggu: string[];
        };
        DateRange: {
            from: string;
            to: string;
        };
        ErrorApiResponseBody: {
            message: string;
            success: boolean;
        };
        ErrorValidationApiResponseBody: {
            cause: components["schemas"]["ValidationErrorCause"][];
            message: string;
            success: boolean;
        };
        FrsResponse: {
            dosen: string;
            ip: components["schemas"]["IP"];
            semester: number[];
            sks: components["schemas"]["SKS"];
            table: components["schemas"]["FrsTableResponse"][];
            tanggalPenting: components["schemas"]["TanggalPenting"];
            year: number[];
        };
        FrsTableResponse: {
            disetujui: string;
            dosen: string;
            group: string;
            id: string;
            kelas: string;
            kode: string;
            mataKuliah: components["schemas"]["MataKuliah"];
            sks: string;
        };
        IP: {
            /** Format: float */
            ipk: number;
            /** Format: float */
            ips: number;
        };
        JadwalKuliahResponse: {
            jamIstirahat: string;
            kelas: string;
            semester: number[];
            table: components["schemas"]["JadwalKuliahTable"];
            year: number[];
        };
        JadwalKuliahTable: {
            jumat: components["schemas"]["Matakuliah"][];
            kamis: components["schemas"]["Matakuliah"][];
            minggu: components["schemas"]["Matakuliah"][];
            rabu: components["schemas"]["Matakuliah"][];
            sabtu: components["schemas"]["Matakuliah"][];
            selasa: components["schemas"]["Matakuliah"][];
            senin: components["schemas"]["Matakuliah"][];
        };
        LobookDetailRequest: {
            /** Format: uint8 */
            minggu: number;
            /** Format: uint8 */
            semester: number;
            /** Format: uint16 */
            tahun: number;
        };
        LogbookCreateRequest: {
            jamMulai: string;
            jamSelesai: string;
            kegiatan: string;
            kpDaftar: string;
            mahasiswa: string;
            /** Format: uint32 */
            matakuliah?: number | null;
            /** Format: uint8 */
            minggu: number;
            /** Format: uint8 */
            semester: number;
            sesuaiKuliah: boolean;
            /** Format: uint16 */
            tahun: number;
            tanggal: string;
        };
        LogbookDeleteBodyRequest: {
            /** Format: uint8 */
            minggu: number;
            /** Format: uint8 */
            semester: number;
            /** Format: uint16 */
            tahun: number;
        };
        LogbookDeleteParamRequest: {
            id: string;
        };
        LogbookDetailResponse: {
            catatanDosen: string;
            catatanPerusahaan: string;
            formDetail: components["schemas"]["LogbookFormDetailResponse"];
            kpDaftar: string;
            mahasiswa: string;
            minggu: number[];
            semester: number[];
            table: components["schemas"]["LogbookTableResponse"][];
            year: number[];
        };
        LogbookFormDetailResponse: {
            listMatkul: components["schemas"]["LogbookMatkulResponse"][];
            nama: string;
            nrp: string;
            pembimbing: string;
            tanggalKp: string;
            tempatKp: string;
        };
        LogbookMatkulResponse: {
            text: string;
            /** Format: uint32 */
            value: number;
        };
        LogbookTableResponse: {
            deletable: boolean;
            fileFoto: string;
            fileProgres?: string | null;
            id: string;
            jamMulai: string;
            jamSelesai: string;
            kegiatan: string;
            linkCetak: string;
            matkulKegiatan: string;
            tanggal: string;
        };
        LoginRequest: {
            email: string;
            password: string;
        };
        LoginResponse: {
            nrp: string;
            /** Format: uint8 */
            semester: number;
            sessionId: string;
            user: string;
            /** Format: uint8 */
            week: number;
            /** Format: uint16 */
            year: number;
        };
        MataKuliah: {
            hari: string;
            jam: string;
            nama: string;
        };
        Matakuliah: {
            dosen: string;
            jam: string;
            nama: string;
            ruangan: string;
        };
        NilaiSemesterResponse: {
            semester: number[];
            table: components["schemas"]["NilaiSemesterTable"][];
            year: number[];
        };
        NilaiSemesterTable: {
            kode: string;
            mataKuliah: string;
            value: string;
        };
        SKS: {
            /** Format: int32 */
            batas: number;
            /** Format: int32 */
            sisa: number;
        };
        SuccessApiResponseBody_for_AbsenResponse: {
            data: components["schemas"]["AbsenResponse"];
            success: boolean;
        };
        SuccessApiResponseBody_for_FrsResponse: {
            data: components["schemas"]["FrsResponse"];
            success: boolean;
        };
        SuccessApiResponseBody_for_JadwalKuliahResponse: {
            data: components["schemas"]["JadwalKuliahResponse"];
            success: boolean;
        };
        SuccessApiResponseBody_for_LogbookDetailResponse: {
            data: components["schemas"]["LogbookDetailResponse"];
            success: boolean;
        };
        SuccessApiResponseBody_for_LoginResponse: {
            data: components["schemas"]["LoginResponse"];
            success: boolean;
        };
        SuccessApiResponseBody_for_NilaiSemesterResponse: {
            data: components["schemas"]["NilaiSemesterResponse"];
            success: boolean;
        };
        SuccessApiResponseBody_for_Null: {
            data: null;
            success: boolean;
        };
        SuccessApiResponseBody_for_String: {
            data: string;
            success: boolean;
        };
        TanggalPenting: {
            drop: components["schemas"]["DateRange"];
            pengisian: components["schemas"]["DateRange"];
            perubahan: components["schemas"]["DateRange"];
        };
        UploadFileRequest: {
            /** Format: binary */
            file?: Blob;
            kpDaftar: string;
            mahasiswa: string;
            /** Format: uint8 */
            minggu: number;
            /** Format: uint8 */
            semester: number;
            /** Format: uint16 */
            tahun: number;
            tanggal: string;
        };
        ValidationErrorCause: {
            field: string;
            message: string[];
        };
        YearSemesterRequest: {
            /** Format: uint8 */
            semester: number;
            /** Format: uint16 */
            tahun: number;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
