# from flask import Flask, request, jsonify
# from common.logger import get_logger
# from service.rinnai_service import RinnaiService

# log = get_logger("http_handler")

# def create_app():
#     app = Flask(__name__)
#     service = RinnaiService()

#     @app.route("/event", methods=["POST"])
#     def receive_event():
#         data = request.get_json(silent=True)
#         if not data:
#             return jsonify({"error": "invalid json"}), 400

#         service.handle_message("http/event", data)
#         return jsonify({"result": "ok"})

#     return app
