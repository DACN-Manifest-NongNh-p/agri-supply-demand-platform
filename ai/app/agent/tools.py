"""Tools the model may call. Page actions (click, type, navigate) join these in the next phase."""
from google.genai import types

from app.retrieval.search import search

SEARCH_POLICY = types.FunctionDeclaration(
    name="search_policy",
    description=(
        "Tìm trong quy định chính thức của Farmora (điều khoản, đấu giá, giữ hàng, cọc, hủy đơn, "
        "giao nhận, chất lượng, điểm uy tín, hỏi đáp). Trả về các đoạn đánh số để trích nguồn."
    ),
    parameters={
        "type": "OBJECT",
        "properties": {
            "query": {"type": "STRING", "description": "Câu hỏi hoặc từ khóa cần tìm, bằng tiếng Việt."},
        },
        "required": ["query"],
    },
)

TOOLS = [types.Tool(function_declarations=[SEARCH_POLICY])]


class SourceBook:
    """Numbers every passage the model has seen in this turn, so [n] in the answer maps to a source."""

    def __init__(self):
        self.sources: list[dict] = []
        self._by_id: dict[str, int] = {}

    def add(self, hit: dict) -> int:
        if hit["id"] not in self._by_id:
            self.sources.append(
                {
                    "n": len(self.sources) + 1,
                    "id": hit["id"],
                    "doc_id": hit["doc_id"],
                    "title": hit["title"],
                    "heading_path": hit["heading_path"],
                    "text": hit["text"],
                }
            )
            self._by_id[hit["id"]] = len(self.sources)
        return self._by_id[hit["id"]]


def run_tool(name: str, args: dict, role: str | None, book: SourceBook) -> dict:
    if name == "search_policy":
        hits = search(str(args.get("query", "")), role, k=5)
        if not hits:
            return {"results": [], "note": "Không tìm thấy đoạn nào phù hợp."}
        return {
            "results": [
                {"n": book.add(hit), "source": hit["heading_path"], "text": hit["text"]}
                for hit in hits
            ]
        }
    return {"error": f"Unknown tool {name}"}


def _browser(name: str, description: str, properties: dict, required: list[str]) -> types.FunctionDeclaration:
    # Every page action may say which plan step it belongs to.
    props = {**properties, "step": {"type": "INTEGER", "description": "Số thứ tự bước trong plan (bắt đầu từ 1)."}}
    return types.FunctionDeclaration(
        name=name, description=description, parameters={"type": "OBJECT", "properties": props, "required": required}
    )


CAPTION = {"type": "STRING", "description": "Câu ngắn tiếng Việt hiện cạnh con trỏ trước khi làm: làm gì và vì sao."}

PLAN = types.FunctionDeclaration(
    name="plan",
    description="Công bố kế hoạch 2–6 bước trước khi thao tác; người dùng thấy dạng danh sách đánh dấu.",
    parameters={
        "type": "OBJECT",
        "properties": {"steps": {"type": "ARRAY", "items": {"type": "STRING"}, "description": "Các bước, mỗi bước một câu ngắn."}},
        "required": ["steps"],
    },
)

# Run in the user's browser by the frontend (chatbot/agent/actions.ts), not here.
BROWSER_DECLARATIONS = [
    _browser("navigate", "Chuyển tới một trang của ứng dụng theo đường dẫn, ví dụ /buyer/orders.",
             {"path": {"type": "STRING", "description": "Đường dẫn bắt đầu bằng /."}, "caption": CAPTION}, ["path", "caption"]),
    _browser("click", "Nhấp vào phần tử [ref] trong ảnh chụp trang mới nhất.",
             {"ref": {"type": "INTEGER"}, "caption": CAPTION}, ["ref", "caption"]),
    _browser("type", "Xóa nội dung rồi gõ chữ vào ô nhập [ref].",
             {"ref": {"type": "INTEGER"}, "text": {"type": "STRING"}, "caption": CAPTION}, ["ref", "text", "caption"]),
    _browser("select", "Chọn một lựa chọn trong ô chọn [ref].",
             {"ref": {"type": "INTEGER"}, "option": {"type": "STRING"}, "caption": CAPTION}, ["ref", "option", "caption"]),
    _browser("scroll", "Cuộn trang để thấy thêm phần tử.",
             {"direction": {"type": "STRING", "enum": ["up", "down", "top", "bottom"]}}, ["direction"]),
]
BROWSER_TOOLS = {declaration.name for declaration in BROWSER_DECLARATIONS}

AGENT_TOOLS = [types.Tool(function_declarations=[SEARCH_POLICY, PLAN, *BROWSER_DECLARATIONS])]
