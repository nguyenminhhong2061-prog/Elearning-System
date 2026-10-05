"""Sinh các biểu đồ ER (db-*.puml) từ Design/schema.sql.

Chạy trong thư mục Design/diagrams:  python gen_er_from_schema.py
Sau đó render như các biểu đồ khác:   java -jar plantuml.jar -charset UTF-8 -tpng -o .. *.puml

Mỗi module một hình. Bảng thuộc module khác nhưng có khóa ngoại nối với module
đang vẽ được vẽ màu xám, không kèm cột. Quan hệ tới tbl_user chỉ được vẽ ở hình
chứa bảng giữ khóa ngoại. Ký hiệu cột: [PK] khóa chính, [FK] khóa
ngoại, [U] duy nhất, [N] cho phép rỗng (giống ký hiệu N của mẫu case study).
"""
import io
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA = os.path.join(HERE, "..", "schema.sql")

MODULES = {
    "db-1-tai-khoan-tu-vung": ["tbl_user", "tbl_level_history", "tbl_topic", "tbl_vocabulary",
                               "tbl_learner_vocabulary", "tbl_vocabulary_review", "tbl_custom_list",
                               "tbl_custom_list_item", "tbl_game_play"],
    "db-2-bai-tap": ["tbl_exercise_lesson", "tbl_reading_passage", "tbl_listening_passage",
                     "tbl_listening_segment", "tbl_pronunciation_item", "tbl_pronunciation_attempt",
                     "tbl_question", "tbl_answer_option", "tbl_accepted_answer", "tbl_sample_answer",
                     "tbl_exercise_attempt", "tbl_exercise_answer"],
    "db-3-chatbot": ["tbl_chat_session", "tbl_chat_message", "tbl_message_source", "tbl_knowledge_chunk"],
    "db-4-kiem-tra": ["tbl_test", "tbl_test_material", "tbl_test_attempt", "tbl_test_answer"],
    "db-5-tien-do-ke-hoach": ["tbl_daily_progress", "tbl_badge", "tbl_learner_badge", "tbl_study_plan",
                              "tbl_study_week", "tbl_reminder"],
}

STOP_WORDS = ("NOT", "NULL", "DEFAULT", "CHECK", "UNIQUE", "REFERENCES", "PRIMARY", "GENERATED")


def strip_comments(sql):
    return "\n".join(line.split("--", 1)[0] for line in sql.splitlines())


def split_top_level(body):
    """Tách phần thân CREATE TABLE theo dấu phẩy ở mức ngoặc ngoài cùng."""
    parts, depth, cur = [], 0, ""
    for ch in body:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        parts.append(cur.strip())
    return parts


def parse_schema(sql):
    tables = {}
    for m in re.finditer(r"CREATE TABLE (\w+) \((.*?)\n\);", strip_comments(sql), re.S):
        name, body = m.group(1), m.group(2)
        cols = []
        for part in split_top_level(body):
            if re.match(r"(CHECK|UNIQUE|PRIMARY|FOREIGN|CONSTRAINT)\b", part):
                continue
            tokens = part.split()
            col = tokens[0]
            type_tokens = []
            for tok in tokens[1:]:
                if tok.upper() in STOP_WORDS:
                    break
                type_tokens.append(tok)
            ref = re.search(r"REFERENCES (\w+)", part)
            cols.append({
                "name": col,
                "type": " ".join(type_tokens),
                "pk": "PRIMARY KEY" in part,
                "unique": bool(re.search(r"\bUNIQUE\b", part)),
                "nullable": "NOT NULL" not in part and "PRIMARY KEY" not in part,
                "ref": ref.group(1) if ref else None,
            })
        tables[name] = cols
    return tables


def column_line(c):
    tags = []
    if c["pk"]:
        tags.append("PK")
    if c["ref"]:
        tags.append("FK")
    if c["unique"]:
        tags.append("U")
    if c["nullable"]:
        tags.append("N")
    suffix = "  [" + ", ".join(tags) + "]" if tags else ""
    return "  {field} %s : %s%s" % (c["name"], c["type"], suffix)


def relation_line(table, c):
    one_side = "|o" if c["nullable"] else "||"
    many_side = "o|" if c["unique"] else "o{"
    return "%s %s--%s %s" % (c["ref"], one_side, many_side, table)


def render(module, own, tables):
    lines = ["@startuml " + module, "!include _style-er.iuml", ""]
    rels, foreign = [], []
    for t, cols in tables.items():
        for c in cols:
            # tbl_user được gần như mọi bảng tham chiếu; quan hệ tới tbl_user chỉ vẽ ở
            # hình chứa bảng giữ khóa ngoại để hình tài khoản không bị rối.
            if c["ref"] and (t in own or (c["ref"] in own and c["ref"] != "tbl_user")):
                rels.append(relation_line(t, c))
                for x in (t, c["ref"]):
                    if x not in own and x not in foreign:
                        foreign.append(x)
    for t in foreign:
        lines.append("entity %s <<ngoai>>" % t)
    lines.append("")
    for t in own:
        lines.append("entity %s {" % t)
        lines += [column_line(c) for c in tables[t]]
        lines.append("}")
    lines.append("")
    lines += rels
    lines.append("@enduml")
    return "\n".join(lines) + "\n"


def main():
    tables = parse_schema(io.open(SCHEMA, encoding="utf-8").read())
    covered = [t for own in MODULES.values() for t in own]
    missing = set(tables) - set(covered)
    if missing or len(covered) != len(set(covered)):
        raise SystemExit("Bảng chưa được gán module hoặc bị gán trùng: %s" % sorted(missing))
    for module, own in MODULES.items():
        path = os.path.join(HERE, module + ".puml")
        io.open(path, "w", encoding="utf-8", newline="\n").write(render(module, own, tables))
        print("đã sinh", module + ".puml", "(%d bảng)" % len(own))


if __name__ == "__main__":
    main()
