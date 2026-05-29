# /backend/test_vector_store.py

from app.services.vector_store import vector_store

pdf_path = r"C:\Users\Surendra Tripathi\Desktop\Semester 6\Blockchain\Syllabus.pdf"

result = vector_store.ingest_pdf(pdf_path)
print(result)

hits = vector_store.similarity_search("What is this PDF about?", k=3)
for i, hit in enumerate(hits, start=1):
    print(f"\n--- Result {i} ---")
    print(hit.metadata)
    print(hit.page_content[:500])
    print(vector_store.collection_stats())